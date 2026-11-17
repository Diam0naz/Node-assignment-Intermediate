import { createServer } from "http";
import dotenv from "dotenv";
import { setTimeout } from "timers/promises";
dotenv.config();



const PORT = process.env.PORT || 8000; 
console.log(PORT);

const users = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Doe" },
  { id: 3, name: "Jim Doe" },
];

const server = createServer(async (req, res) => {
  try {
    // Normalize the path: drop the query string and any trailing slash, so
    // "/api/users", "/api/users/" and "/api/users?x=1" all match the same route.
    const path = new URL(req.url, "http://localhost").pathname.replace(/\/+$/, "") || "/";

    if (req.method === "GET" && path === "/api/users") {
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8", // explicit charset stops browsers buffering to detect encoding
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",         // stops browsers buffering to sniff the MIME type
        "X-Accel-Buffering": "no",                   // stops nginx-style proxies buffering the stream
      });
      res.flushHeaders(); // send headers immediately, before the first chunk

      // Abort the pending delay if the client disconnects mid-stream.
      const ac = new AbortController();
      res.on("close", () => ac.abort());

      for (const [i, user] of users.entries()) {
        res.write(JSON.stringify(user) + "\n");
        if (i < users.length - 1) {
          await setTimeout(5000, undefined, { signal: ac.signal });
        }
      }
      return res.end();
    }

    // const match = req.method === "GET" && req.url.match(/^\/api\/users\/(\d+)$/);
    // if (match) {
    //   const id = Number(match[1]);
    //   const user = users.find(u => u.id === id);
    //   if (!user) {
    //     res.writeHead(404, { "Content-Type": "application/json" });
    //     return res.end(JSON.stringify({ message: "User not found" }));
    //   }
    //   res.writeHead(200, { "Content-Type": "application/json" });
    //   return res.end(JSON.stringify(user));
    // }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route Not Found!" }));

  } catch (err) {
    if (err.name === "AbortError") return; // client disconnected mid-stream; nothing to send
    console.error(err);
    if (res.headersSent) {
      // Already streaming a 200 — can't switch to a 500 now, so just cut the connection.
      return res.destroy(err);
    }
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

