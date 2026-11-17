// Automated checker for the Bank Server assignment.
//
//   npm test   -> checks YOUR code in bank-server/starter
//   BANK_DIR=path/to/other/folder npm test   -> checks a different copy (e.g. for grading)
//
// It starts your server on a free port, sends real HTTP requests with fetch(),
// and checks the status codes, headers and bodies. Tests run top to bottom and
// share one server, so later tests rely on the accounts created earlier.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const bankDir = process.env.BANK_DIR
  ? path.resolve(process.env.BANK_DIR)
  : fileURLToPath(new URL("../starter", import.meta.url));
const serverFile = path.join(bankDir, "server.js");

let child;
let base;

before(async () => {
  child = spawn(process.execPath, [serverFile], {
    env: { ...process.env, PORT: "0" }, // port 0 = let the OS pick a free port
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));

  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Server did not start.\n${stderr}`)), 5000);
    child.stdout.on("data", (d) => {
      const match = String(d).match(/http:\/\/localhost:(\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(`http://localhost:${match[1]}`);
      }
    });
    child.on("exit", (code) => reject(new Error(`Server exited with code ${code}.\n${stderr}`)));
  });
});

after(() => child?.kill());

const get = (path) => fetch(base + path, { redirect: "manual" });
const sendJson = (method, path, body) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const postForm = (path, fields) =>
  fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
    redirect: "manual",
  });

const isJson = (res) => assert.match(res.headers.get("content-type") ?? "", /application\/json/);
const isHtml = (res) => assert.match(res.headers.get("content-type") ?? "", /text\/html/);

// ---------- Part 1: routing basics ----------

test("Part 1: GET /api/accounts lists the 3 seed accounts as JSON", async () => {
  const res = await get("/api/accounts");
  assert.equal(res.status, 200);
  isJson(res);
  const body = await res.json();
  assert.ok(Array.isArray(body), "body should be an array");
  assert.equal(body.length, 3);
  assert.deepEqual(Object.keys(body[0]).sort(), ["balance", "createdAt", "id", "owner"]);
});

test("Part 1: a trailing slash still matches (/api/accounts/)", async () => {
  const res = await get("/api/accounts/");
  assert.equal(res.status, 200);
});

test("Part 1: GET /api/accounts/1 returns one account", async () => {
  const res = await get("/api/accounts/1");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.id, 1);
  assert.equal(body.owner, "Ada Lovelace");
  assert.equal(body.balance, 150000);
});

test("Part 1: unknown account -> 404 JSON error", async () => {
  const res = await get("/api/accounts/999");
  assert.equal(res.status, 404);
  isJson(res);
  assert.ok((await res.json()).error, "body should have an `error` message");
});

test("Part 1: non-numeric id -> 400", async () => {
  const res = await get("/api/accounts/abc");
  assert.equal(res.status, 400);
});

test("Part 1: unknown route -> 404", async () => {
  const res = await get("/api/nope");
  assert.equal(res.status, 404);
});

test("Part 1: wrong method on a real path -> 405 with Allow header", async () => {
  const res = await fetch(base + "/api/accounts", { method: "PUT" });
  assert.equal(res.status, 405);
  assert.match(res.headers.get("allow") ?? "", /GET/);
  assert.match(res.headers.get("allow") ?? "", /POST/);
});

test("Part 1: query string filter ?minBalance=", async () => {
  const res = await get("/api/accounts?minBalance=100000");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.map((a) => a.id), [1]);

  const bad = await get("/api/accounts?minBalance=lots");
  assert.equal(bad.status, 400);
});

// ---------- Part 2: reading request bodies ----------

test("Part 2: POST /api/accounts creates an account (201 + Location)", async () => {
  const res = await sendJson("POST", "/api/accounts", { owner: "Katherine Johnson", initialDeposit: 5000 });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get("location"), "/api/accounts/4");
  const body = await res.json();
  assert.equal(body.id, 4);
  assert.equal(body.owner, "Katherine Johnson");
  assert.equal(body.balance, 5000);
});

test("Part 2: invalid JSON body -> 400", async () => {
  const res = await sendJson("POST", "/api/accounts", "{ not json");
  assert.equal(res.status, 400);
});

test("Part 2: missing owner -> 400", async () => {
  const res = await sendJson("POST", "/api/accounts", { initialDeposit: 100 });
  assert.equal(res.status, 400);
});

test("Part 2: deposit adds money", async () => {
  const res = await sendJson("POST", "/api/accounts/4/deposit", { amount: 2500 });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).balance, 7500);
});

test("Part 2: bad amounts are rejected (negative, zero, decimal, text)", async () => {
  for (const amount of [-5, 0, 10.5, "ten"]) {
    const res = await sendJson("POST", "/api/accounts/4/deposit", { amount });
    assert.equal(res.status, 400, `amount ${JSON.stringify(amount)} should be rejected`);
  }
});

test("Part 2: withdraw removes money", async () => {
  const res = await sendJson("POST", "/api/accounts/4/withdraw", { amount: 1500 });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).balance, 6000);
});

test("Part 2: withdrawing more than the balance -> 409", async () => {
  const res = await sendJson("POST", "/api/accounts/4/withdraw", { amount: 999999 });
  assert.equal(res.status, 409);
  const check = await (await get("/api/accounts/4")).json();
  assert.equal(check.balance, 6000, "balance must not change after a failed withdrawal");
});

// ---------- Part 3: transfers, history, closing ----------

test("Part 3: transfer moves money between two accounts", async () => {
  const res = await sendJson("POST", "/api/transfers", { fromId: 1, toId: 3, amount: 10000 });
  assert.equal(res.status, 200);
  const a1 = await (await get("/api/accounts/1")).json();
  const a3 = await (await get("/api/accounts/3")).json();
  assert.equal(a1.balance, 140000);
  assert.equal(a3.balance, 10000);
});

test("Part 3: transfer to a missing account changes nothing", async () => {
  const res = await sendJson("POST", "/api/transfers", { fromId: 1, toId: 999, amount: 100 });
  assert.equal(res.status, 404);
  const a1 = await (await get("/api/accounts/1")).json();
  assert.equal(a1.balance, 140000, "money must not leave account 1");
});

test("Part 3: transfer to the same account -> 400", async () => {
  const res = await sendJson("POST", "/api/transfers", { fromId: 1, toId: 1, amount: 100 });
  assert.equal(res.status, 400);
});

test("Part 3: transaction history", async () => {
  const res = await get("/api/accounts/4/transactions");
  assert.equal(res.status, 200);
  const txs = await res.json();
  assert.deepEqual(
    txs.map((t) => [t.type, t.amount, t.balanceAfter]),
    [
      ["deposit", 5000, 5000],
      ["deposit", 2500, 7500],
      ["withdrawal", 1500, 6000],
    ],
  );
});

test("Part 3: closing an account that still has money -> 409", async () => {
  const res = await fetch(base + "/api/accounts/4", { method: "DELETE" });
  assert.equal(res.status, 409);
});

test("Part 3: closing an empty account -> 204, then it is gone", async () => {
  await sendJson("POST", "/api/accounts/4/withdraw", { amount: 6000 });
  const res = await fetch(base + "/api/accounts/4", { method: "DELETE" });
  assert.equal(res.status, 204);
  assert.equal((await get("/api/accounts/4")).status, 404);
});

// ---------- Part 4: server-rendered HTML ----------

test("Part 4: GET / renders an HTML home page", async () => {
  const res = await get("/");
  assert.equal(res.status, 200);
  isHtml(res);
  const html = await res.text();
  assert.match(html, /<!DOCTYPE html>/i);
  assert.match(html, /Node Bank/);
});

test("Part 4: GET /accounts renders a table with every owner", async () => {
  const res = await get("/accounts");
  assert.equal(res.status, 200);
  isHtml(res);
  const html = await res.text();
  for (const owner of ["Ada Lovelace", "Alan Turing", "Grace Hopper"]) {
    assert.ok(html.includes(owner), `page should mention ${owner}`);
  }
  assert.match(html, /href="\/accounts\/1"/);
});

test("Part 4: GET /accounts/1 renders the account page with formatted balance", async () => {
  const res = await get("/accounts/1");
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes("1,400.00"), "balance 140000 cents should show as 1,400.00");
});

test("Part 4: unknown page -> 404 as HTML, not JSON", async () => {
  const res = await get("/accounts/999");
  assert.equal(res.status, 404);
  isHtml(res);
});

test("Part 4: user input is HTML-escaped (no XSS)", async () => {
  const created = await sendJson("POST", "/api/accounts", { owner: "<script>alert(1)</script>" });
  const { id } = await created.json();
  const html = await (await get(`/accounts/${id}`)).text();
  assert.ok(!html.includes("<script>alert(1)</script>"), "raw <script> tag must not appear in the page");
  assert.ok(html.includes("&lt;script&gt;"), "the name should appear escaped");
});

test("Part 4: GET /styles.css is served with a CSS content type", async () => {
  const res = await get("/styles.css");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/css/);
});

// ---------- Part 5 (bonus): HTML forms ----------

test("Bonus: deposit form posts and redirects back (303)", async () => {
  const res = await postForm("/accounts/2/deposit", { amount: "500" });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("location"), "/accounts/2");
  const a2 = await (await get("/api/accounts/2")).json();
  assert.equal(a2.balance, 73000);
});

test("Bonus: withdraw form posts and redirects back (303)", async () => {
  const res = await postForm("/accounts/2/withdraw", { amount: "1000" });
  assert.equal(res.status, 303);
  const a2 = await (await get("/api/accounts/2")).json();
  assert.equal(a2.balance, 72000);
});
