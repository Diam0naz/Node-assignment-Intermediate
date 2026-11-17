# Assignment: Build a Bank Server with plain Node.js

You will build a small bank: a **JSON API** for apps, plus **HTML pages** that the
server renders itself. You may only use Node's built-in modules (`node:http`,
`node:fs`, `URL`, …).

> 🚫 **No Express or any other framework.** The whole point is to see what a framework
> does for you: parsing URLs, matching routes, reading request bodies, setting
> status codes and headers.

## What you'll practise

| Concept | Where you meet it |
|---|---|
| `http.createServer`, `req`, `res` | `server.js` (read it first) |
| Parsing URLs and query strings with `new URL()` | `router.js`, `?minBalance=` |
| Routing, path parameters (`/accounts/:id`) | `matchPath()` in `router.js` |
| HTTP methods and status codes (200, 201, 204, 303, 400, 404, 405, 409) | everywhere |
| Response headers (`Content-Type`, `Location`, `Allow`) | `utils/http.js`, controllers |
| Reading a request body from a stream | `readBody()` in `utils/http.js` |
| Server-side HTML rendering with template strings | `controllers/pagesController.js` |
| HTML escaping and XSS | `escapeHtml()` in `views/layout.js` |
| Serving a static file from disk | `GET /styles.css` |
| Why money is stored as integer cents | `data/accounts.js` |

## Getting started

```bash
npm install
npm start      # runs YOUR server (bank-server/starter) with auto-restart
npm test       # runs the automated checker against YOUR server
```

Open <http://localhost:8000>. At first every route answers
`501 Not implemented yet: …`. That's expected: each `todo("…")` call marks a piece
for you to write. Delete the `todo(...)` once you implement that piece.

`npm test` prints one line per requirement. Your goal is to turn them all from
`not ok` into `ok`. Work through the parts **in order**, because later parts
depend on earlier ones.

## Project layout (inside `starter/`)

```
server.js                    ✅ complete: creates the server, turns errors into responses
router.js                    route table + matchPath() + normalizePath()
utils/http.js                sendJson ✅, sendHtml, redirect, readBody, readJsonBody, readFormBody
utils/validate.js            parseId ✅, parseAmount, parseOwner
data/accounts.js             in-memory "database" of accounts and transactions
controllers/apiController.js   JSON API handlers
controllers/pagesController.js HTML page handlers
views/layout.js              layout ✅, formatMoney ✅, escapeHtml
public/styles.css            ✅ the stylesheet
```

Lines marked ✅ are given. Read them: they are worked examples of the patterns you'll repeat.

## The rules of the bank

- Money is an **integer number of cents**. `150000` means 1,500.00. Amounts must be positive whole numbers.
- You can't withdraw or transfer more than an account holds (`409 Conflict`).
- An account can only be closed when its balance is exactly `0` (`409`).
- Every deposit, withdrawal and transfer is recorded as a **transaction**.
- Errors from `/api/...` routes are JSON: `{ "error": "message" }`. Errors from pages are HTML.

## Part 1: URLs and routing ⭐ start here

In `router.js`:

1. **`matchPath(pattern, path)`**: compare a pattern like `/accounts/:id` with a real path like `/accounts/7` and return `{ id: "7" }`, or `null` if it doesn't match. Nothing works until this does.
2. **`normalizePath()`**: `/api/accounts/` and `/api/accounts` must be the same route.
3. **405 Method Not Allowed**: `PUT /api/accounts` should give `405` (not `404`) with an `Allow: GET, POST` header.

Then `GET /api/accounts?minBalance=100000` should only return rich accounts. You need a filter in `data/accounts.js` and query parsing in `apiController.listAccounts`.

| Method | Path | Success |
|---|---|---|
| GET | `/api/accounts` (optional `?minBalance=`) | 200, array of accounts |
| GET | `/api/accounts/:id` | 200, one account |

## Part 2: Request bodies

Node does **not** give you `req.body`. The body arrives as a stream of chunks, and you collect them.

1. `readBody()` and `readJsonBody()` in `utils/http.js`. Invalid JSON must give `400`, never crash the server.
2. `parseAmount()` and `parseOwner()` in `utils/validate.js`.
3. `withdraw()` in `data/accounts.js` and the create / withdraw handlers in `apiController.js`.

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/api/accounts` | `{ "owner": "Ada", "initialDeposit": 5000 }` | **201** + `Location` header |
| POST | `/api/accounts/:id/deposit` | `{ "amount": 500 }` | 200, updated account |
| POST | `/api/accounts/:id/withdraw` | `{ "amount": 500 }` | 200, updated account |

Try it from a second terminal:

```bash
curl -i -X POST http://localhost:8000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"owner": "Katherine Johnson", "initialDeposit": 5000}'
```

(`-i` shows the status line and headers. Get used to reading them.)

## Part 3: Transfers, history, closing

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/api/transfers` | `{ "fromId": 1, "toId": 2, "amount": 500 }` | 200 |
| GET | `/api/accounts/:id/transactions` | | 200, oldest first |
| DELETE | `/api/accounts/:id` | | **204**, no body |

⚠️ A transfer to an account that doesn't exist must **not** take money out of the sender.
Check everything *before* you change anything.

## Part 4: Server-rendered HTML

Build whole pages on the server using template strings, then send them with `sendHtml()`.

| Method | Path | Page |
|---|---|---|
| GET | `/` | home: number of accounts and total money (given, once `sendHtml` works) |
| GET | `/accounts` | table of all accounts, each owner linking to their page |
| GET | `/accounts/:id` | owner, formatted balance, transaction table |
| GET | `/styles.css` | the stylesheet, read from `public/styles.css` |

Then fix `escapeHtml()`. Create an account whose owner is `<script>alert(1)</script>`
*before* fixing it and open its page to see why this matters.

## Bonus: HTML forms (no JavaScript in the browser)

On `/accounts/:id`, add two `<form method="POST">` elements for deposit and withdraw. Handle them at:

| Method | Path | Body (form-encoded) | Success |
|---|---|---|---|
| POST | `/accounts/:id/deposit` | `amount=500` | **303** redirect to `/accounts/:id` |
| POST | `/accounts/:id/withdraw` | `amount=500` | **303** redirect to `/accounts/:id` |

Find out why we redirect instead of rendering the page directly (search for "Post/Redirect/Get").

## Going further (not tested)

- Stream a big transaction export as NDJSON (see `examples/04-streaming`).
- Save the data to a JSON file with `node:fs/promises` so it survives restarts.
- Add an `X-Request-Id` header to every response and include it in the log line.

## Submitting

Make sure `npm test` passes, then submit your `starter/` folder.
Grading: Part 1–3 = 60%, Part 4 = 30%, code clarity = 10%, bonus = +10%.
