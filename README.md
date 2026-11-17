# Node.js fundamentals (no frameworks)

```
examples/                   class demos, in lesson order
  01-modules/               ES modules: import / export
  02-core-modules/          os, timers
  03-static-pages/          first http server serving HTML files
  04-streaming/             streaming a response chunk by chunk
  05-html-router-json/      fs + url + path: route to HTML files, save form posts to JSON
bank-server/                📝 the assignment (start with bank-server/README.md)
  starter/                  students write their code here
  test/                     automated checker
```

## Commands

| Command | What it does |
|---|---|
| `npm install` | install dependencies (first time only) |
| `npm start` | run the bank server from `bank-server/starter` on port 8000 with auto-restart |
| `npm test` | check `bank-server/starter` against the assignment requirements |
| `npm run example:static` | run the static pages example |
| `npm run example:stream` | run the streaming example |
| `npm run example:pages` | run the HTML pages + JSON storage example |

`PORT` comes from `.env`.
