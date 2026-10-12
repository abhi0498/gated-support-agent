import { createServer, type Server } from "node:http";

// Placeholder HTTP server. GraphQL Yoga replaces the handler in P6.
export function createApiServer(): Server {
  return createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404).end();
  });
}
