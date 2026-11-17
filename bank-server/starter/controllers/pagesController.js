// HTML page handlers: build the whole page on the server and send it as a string.
// No React, no template engine: just template literals and sendHtml().
import { readFile } from "node:fs/promises";
import * as store from "../data/accounts.js";
import { sendHtml, readFormBody, redirect, todo } from "../utils/http.js";
import { parseId, parseAmount } from "../utils/validate.js";
import { layout, escapeHtml, formatMoney } from "../views/layout.js";

// ✅ Given: GET /   Use it as the pattern for the other pages.
// (It won't work until you finish sendHtml.)
export function home(req, res) {
  const accounts = store.listAccounts();
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  sendHtml(
    res,
    200,
    layout(
      "Home",
      `<h1>Welcome to Node Bank</h1>
      <p>We look after <strong>${accounts.length}</strong> accounts holding
         <strong>${formatMoney(total)}</strong> in total.</p>
      <p><a href="/accounts">View all accounts →</a></p>`,
    ),
  );
}

// TODO (Part 4): GET /accounts
// Render a <table> with one row per account: id, owner (a link to /accounts/<id>), balance.
// Hint: build the rows with accounts.map(a => `<tr>...</tr>`).join("")
// ⚠️ Always wrap user data in escapeHtml(...).
export function accountList(req, res) {
  todo("GET /accounts");
}

// TODO (Part 4): GET /accounts/:id
// Show the owner's name, the balance (use formatMoney) and a table of transactions.
// An unknown id must give a 404 page (findAccount already throws for you).
// Bonus: add two <form method="POST"> elements that post `amount` to
//        /accounts/<id>/deposit and /accounts/<id>/withdraw
export function accountDetail(req, res, { params }) {
  todo("GET /accounts/:id");
}

// TODO (Bonus): POST /accounts/:id/deposit  (from an HTML form)
// Read the form body, deposit, then redirect(res, `/accounts/${id}`).
// Why redirect? Look up the "Post/Redirect/Get" pattern, then try refreshing the page without it.
export async function depositForm(req, res, { params }) {
  todo("POST /accounts/:id/deposit");
}

// TODO (Bonus): POST /accounts/:id/withdraw  (from an HTML form)
export async function withdrawForm(req, res, { params }) {
  todo("POST /accounts/:id/withdraw");
}

// TODO (Part 4): GET /styles.css
// Read ../public/styles.css from disk with readFile and send it with Content-Type "text/css; charset=utf-8".
// Hint: new URL("../public/styles.css", import.meta.url) gives the file's location
// no matter which folder you started node from.
export async function styles(req, res) {
  todo("GET /styles.css");
}
