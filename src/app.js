const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const config = require("./config/config");
const setupWebSocket = require("./routes/websocket");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

setupWebSocket(wss);

server.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
