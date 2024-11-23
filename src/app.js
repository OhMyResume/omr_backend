const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const config = require("./config/config");
const setupWebSocket = require("./routes/websocket");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const NodeCache = require("node-cache");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
  clientTracking: true,
  maxPayload: 50 * 1024,
});
const myCache = new NodeCache({ stdTTL: 100 });

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

app.get("/v1/status", (req, res) => {
  res.json({ status: "ok" });
});

setupWebSocket(wss);

server.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
