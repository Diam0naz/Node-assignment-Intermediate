// Minimal server using only Node's core modules:
//   http -> the server        url  -> parse request URLs, find this file's folder
//   path -> build file paths  fs   -> read HTML files, read/write a JSON "database"
//
// Routes:
//   GET  /, /about, /contact  -> serve pages/<name>.html
//   POST /contact             -> save the form to data/messages.json, redirect to /thanks
//   GET  /api/messages        -> the saved messages as JSON
import http from "node:http";
import fs from "node:fs/promises";
import url from "node:url";
import path from "node:path";

const PORT = process.env.PORT || 8000;

// ES modules have no __dirname, so build it from this file's URL.
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, "pages");
const DATA_FILE = path.join(__dirname, "data", "messages.json");

// ---- JSON "database" ----
async function readMessages() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return []; // file doesn't exist yet
    throw err;
  }
}

async function saveMessage(message) {
  const messages = await readMessages();
  messages.push({ id: messages.length + 1, ...message, createdAt: new Date().toISOString() });
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2));
}

// ---- helpers ----
async function sendPage(res, name, status = 200) {
  // path.basename() strips any "../" so a URL can't escape the pages folder.
  const file = path.join(PAGES_DIR, `${path.basename(name)}.html`);
  const html = await fs.readFile(file); // throws ENOENT if the page doesn't exist
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body;
}

// ---- server ----
const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  console.log(req.method, pathname);

  try {
    if (req.method === "POST" && pathname === "/contact") {
      // HTML forms send "name=Ada&message=Hi" -> URLSearchParams parses it.
      const form = Object.fromEntries(new URLSearchParams(await readBody(req)));
      await saveMessage({ name: form.name, message: form.message });
      res.writeHead(303, { Location: "/thanks" }); // redirect so refresh doesn't resubmit
      return res.end();
    }

    if (req.method === "GET" && pathname === "/api/messages") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(await readMessages()));
    }

    if (req.method === "GET") {
      // "/" -> index, "/about" -> about, "/about/" -> about
      const name = pathname.replace(/^\/|\/$/g, "") || "index";
      return await sendPage(res, name);
    }

    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
  } catch (err) {
    if (err.code === "ENOENT") return sendPage(res, "404", 404);
    console.error(err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server Error");
  }
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
