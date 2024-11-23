const ResumeSession = require("../models/ResumeSession");
const sessionStore = require("../utils/sessionStore");

// Track active connections
const activeConnections = new Map();

function setupWebSocket(wss) {
  // Track active connections
  const activeConnections = new Map();
  const connectionsPerIP = new Map();
  const maxConnections = 100;

  // Cleanup function
  const cleanup = async (ws, ip) => {
    const session = activeConnections.get(ws);
    if (session) {
      await session.cleanup();
    }
    activeConnections.delete(ws);
    const currentCount = connectionsPerIP.get(ip) || 0;
    if (currentCount > 0) {
      connectionsPerIP.set(ip, currentCount - 1);
    }
  };

  wss.on("connection", async (ws, req) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Check connection limits
    if (wss.clients.size >= maxConnections) {
      ws.close(1013, "Server is at capacity");
      return;
    }

    const ipConnections = connectionsPerIP.get(ip) || 0;
    if (ipConnections >= 5) {
      ws.close(1013, "Too many connections from this IP");
      return;
    }

    // Update connection tracking
    connectionsPerIP.set(ip, ipConnections + 1);

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const sessionId = url.searchParams.get("sessionId");

      const session = new ResumeSession(ws);
      activeConnections.set(ws, session);

      // Set up WebSocket event handlers
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());

          switch (data.type) {
            case "answer":
              await session.processAnswer(data.content);
              break;
            case "restart":
              await session.cleanup();
              await session.start();
              break;
            default:
              ws.send(
                JSON.stringify({
                  type: "error",
                  data: { message: "Unknown message type" },
                })
              );
          }
        } catch (error) {
          console.error("Message processing error:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              data: { message: "Failed to process message" },
            })
          );
        }
      });

      ws.on("close", () => cleanup(ws, ip));
      ws.on("error", () => cleanup(ws, ip));

      // Start the session
      await session.start(sessionId);
    } catch (error) {
      console.error("Connection setup error:", error);
      cleanup(ws, ip);
      ws.close(1011, "Failed to setup session");
    }
  });

  // Heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        cleanup(ws, ws._socket?.remoteAddress);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Cleanup interval on server shutdown
  wss.on("close", () => {
    clearInterval(interval);
  });
}

module.exports = setupWebSocket;
