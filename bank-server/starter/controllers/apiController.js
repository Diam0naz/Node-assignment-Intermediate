// JSON API handlers. Every handler receives (req, res, { params, query }):
//   params: values from the path,   e.g. /api/accounts/7 -> { id: "7" }   (always strings!)
//   query:  a URLSearchParams,      e.g. ?minBalance=500 -> query.get("minBalance") === "500"
import * as store from "../data/accounts.js";
import { sendJson, readJsonBody, HttpError, todo } from "../utils/http.js";
import { parseId, parseAmount, parseOwner } from "../utils/validate.js";

// GET /api/accounts
// TODO (Part 1): support ?minBalance=50000. If it's present but not an integer -> 400.
export function listAccounts(req, res, { query }) {
  sendJson(res, 200, store.listAccounts());
}

// ✅ Given: GET /api/accounts/:id
export function getAccount(req, res, { params }) {
  sendJson(res, 200, store.findAccount(parseId(params.id)));
}

// TODO (Part 2): POST /api/accounts   body: { "owner": "Ada", "initialDeposit": 5000 }
//  - initialDeposit is optional (default 0)
//  - respond 201 Created, with a `Location: /api/accounts/<new id>` header and the new account as JSON
export async function createAccount(req, res) {
  todo("POST /api/accounts");
}

// ✅ Given: POST /api/accounts/:id/deposit   body: { "amount": 500 }
// (It won't work until you finish readJsonBody and parseAmount.)
export async function deposit(req, res, { params }) {
  const id = parseId(params.id);
  const { amount } = await readJsonBody(req);
  sendJson(res, 200, store.deposit(id, parseAmount(amount)));
}

// TODO (Part 2): POST /api/accounts/:id/withdraw   body: { "amount": 500 }
export async function withdraw(req, res, { params }) {
  todo("POST /api/accounts/:id/withdraw");
}

// TODO (Part 3): POST /api/transfers   body: { "fromId": 1, "toId": 2, "amount": 500 }
export async function transfer(req, res) {
  todo("POST /api/transfers");
}

// TODO (Part 3): GET /api/accounts/:id/transactions
export function listTransactions(req, res, { params }) {
  todo("GET /api/accounts/:id/transactions");
}

// TODO (Part 3): DELETE /api/accounts/:id
// On success respond 204 No Content: res.writeHead(204) then res.end() with NO body.
export function closeAccount(req, res, { params }) {
  todo("DELETE /api/accounts/:id");
}
