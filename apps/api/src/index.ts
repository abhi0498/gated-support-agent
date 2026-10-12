import { createApiServer } from "./server.js";

const port = Number(process.env.PORT ?? 4000);

createApiServer().listen(port, () => {
  console.log(`api listening on http://localhost:${String(port)}`);
});
