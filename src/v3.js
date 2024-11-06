const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const Groq = require("groq-sdk");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Simple resume template for testing
const resumeTemplate = {
  personalInfo: {
    name: "",
    email: "",
    phone: "",
    title: "",
  },
  summary: "",
  experience: [],
  skills: [],
};

// Simplified question sequence for testing
const questionSequence = [
  {
    id: "name",
    question: "Hello! What's your name?",
    field: "personalInfo.name",
    type: "text",
  },
  {
    id: "email",
    question: "What's your email address?",
    field: "personalInfo.email",
    type: "email",
  },
  {
    id: "phone",
    question: "What's your phone number?",
    field: "personalInfo.phone",
    type: "phone",
  },
  {
    id: "title",
    question: "What's your current job title?",
    field: "personalInfo.title",
    type: "text",
  },
  {
    id: "summary",
    question: "Tell me about yourself in 1-2 sentences.",
    field: "summary",
    type: "text",
  },
  {
    id: "experience",
    question:
      " Let's move on to your work experience. What's your current job?",
    field: "experience",
    type: "text",
  },
  {
    id: "skills",
    question: "What are your skills?",
    field: "skills",
    type: "text",
  },
  {
    id: "education",
    question: "What's your education?",
    field: "education",
    type: "text",
  },
  {
    id: "certifications",
    question: "What are your certifications?",
    field: "certifications",
    type: "text",
  },
];

class ResumeSession {
  constructor(ws) {
    this.ws = ws;
    this.currentQuestionIndex = 0;
    this.resume = { ...resumeTemplate };
    console.log("New session created");
  }

  async start() {
    console.log("Starting new resume session");
    this.sendQuestion(questionSequence[0]);
  }

  sendQuestion(questionData) {
    const message = {
      type: "question",
      data: questionData,
      currentResume: this.resume,
    };
    console.log("Sending question:", message);
    this.ws.send(JSON.stringify(message));
  }

  updateResumeField(field, value) {
    const fieldPath = field.split(".");
    let current = this.resume;

    for (let i = 0; i < fieldPath.length - 1; i++) {
      if (!current[fieldPath[i]]) {
        current[fieldPath[i]] = {};
      }
      current = current[fieldPath[i]];
    }

    current[fieldPath[fieldPath.length - 1]] = value;
    console.log("Updated resume:", this.resume);
  }

  async processAnswer(answer) {
    const currentQuestion = questionSequence[this.currentQuestionIndex];
    console.log("Processing answer for question:", currentQuestion.id);
    console.log("Answer received:", answer);

    try {
      // Update resume directly for testing (without AI processing)
      this.updateResumeField(currentQuestion.field, answer);

      // Send update to client
      this.ws.send(
        JSON.stringify({
          type: "update",
          data: {
            field: currentQuestion.field,
            value: answer,
            currentResume: this.resume,
          },
        })
      );

      // Move to next question
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex < questionSequence.length) {
        this.sendQuestion(questionSequence[this.currentQuestionIndex]);
      } else {
        // Resume is complete
        console.log("Resume complete:", this.resume);
        this.ws.send(
          JSON.stringify({
            type: "complete",
            data: {
              message: "Your resume is complete!",
              finalResume: this.resume,
            },
          })
        );
      }
    } catch (error) {
      console.error("Error processing answer:", error);
      this.ws.send(
        JSON.stringify({
          type: "error",
          data: {
            message: "Error processing your response",
            error: error.message,
          },
        })
      );
    }
  }
}

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("New client connected");
  const session = new ResumeSession(ws);

  // Start the resume building process
  session.start();

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Received message:", data);

      switch (data.type) {
        case "answer":
          await session.processAnswer(data.content);
          break;
        case "restart":
          console.log("Restarting session");
          session.currentQuestionIndex = 0;
          session.resume = { ...resumeTemplate };
          session.start();
          break;
        default:
          console.log("Unknown message type:", data.type);
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
          data: { message: error.message },
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
