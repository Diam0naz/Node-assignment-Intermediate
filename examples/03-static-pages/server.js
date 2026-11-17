import http from "http";
import fs from "fs/promises";
import url from "url";
import path from "path";
import { write } from "fs";
const PORT = process.env.PORT;

const server = http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.statusCode = 404
    res.write("Hello World");
    res.end("<h1>Hello World</h1>");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(JSON.stringify({ message: "Server Error" }));
    res.end("<h1>Hello World</h1>");

  // Get current path
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  try {
    if (req.method === "GET") {
      let filePath;
      if (req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Hello World</h1>");
        filePath = path.join(__dirname, "public", "index.html");
      } else if (req.url === "/about") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Welcome about</h1>");
        filePath = path.join(__dirname, "public", "about.html");
      } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>Page Not Found</h1>");
        throw new Error("Page Not Found!");
      }

      const data = await fs.readFile(filePath);
      res.setHeader("Content-Type", "text/html");
      res.write(data);
    } else {
      throw new Error(`Method Not Allowed`);
    }
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server Error");
  }

  console.log(req.method);
  console.log(req.url);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
