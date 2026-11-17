// ✅ This file is complete. Read it, but you shouldn't need to change it.
import { createServer } from "node:http";
import { handleRequest } from "./router.js";
import { sendJson, sendHtml } from "./utils/http.js";
import { layout, escapeHtml } from "./views/layout.js";

const PORT = process.env.PORT ?? 8000;

const server = createServer(async (req, res) => {
  // Log every request once its response has been sent.
  const started = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - started}ms)`);
  });

  try {
    await handleRequest(req, res);
  } catch (err) {
    // Anything thrown with a .status (HttpError) becomes that status; everything else is a 500.
    const status = err.status ?? 500;
    // Never leak internal error details to the client; log them instead.
    const message = status === 500 ? "Internal server error" : err.message;
    if (status === 500) console.error(err);

    if (res.headersSent) return res.destroy();

    try {
      // API routes answer in JSON, page routes answer in HTML.
      if (req.url.startsWith("/api")) {
        sendJson(res, status, { error: message });
      } else {
        sendHtml(
          res,
          status,
          layout(`Error ${status}`, `<h1>Error ${status}</h1><p>${escapeHtml(message)}</p><p><a href="/">Go home</a></p>`),
        );
      }
    } catch {
      // Fallback while sendHtml is still a TODO: plain text.
      if (!res.headersSent) res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Error ${status}: ${message}`);
    }
  }
});

server.listen(PORT, () => {
  console.log(`Bank server listening on http://localhost:${server.address().port}`);
});
