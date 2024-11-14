const ResumeSession = require("../models/ResumeSession");

function setupWebSocket(wss) {
  wss.on("connection", (ws) => {
    console.log("New client connected");
    const session = new ResumeSession(ws);
    session.start();

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case "answer":
            await session.processAnswer(data.content);
            break;
          case "restart":
            session.currentQuestionIndex = 0;
            session.resume = { ...resumeTemplate };
            session.start();
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
        console.error("Error processing message:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Sorry, something went wrong. Please try again." },
          })
        );
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
}

module.exports = setupWebSocket;
