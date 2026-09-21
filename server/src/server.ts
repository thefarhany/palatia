import http from "http";
import { createApp } from "./app.js";
import { setupSocket } from "./socket/index.js";
import { setIo } from "./lib/realtime.js";
import env from "./lib/env.js";

const httpServer = http.createServer(createApp());
const io = setupSocket(httpServer, env.CORS_ORIGIN);
setIo(io);

// Exposed for later route modules to emit events (order:created, inventory:low, ...).
export { io };

httpServer.listen(env.PORT, () => {
  console.log(`palatia server on :${env.PORT}`);
});