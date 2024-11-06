const express = require("express");
const Groq = require("groq-sdk");
// dotenv conf
require("dotenv").config();

const app = express();
app.use(express.json());

// Initialize GROQ and Zep AI clients
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],
    model: "llama3-8b-8192",
  });
}

app.get("/chat", async (req, res) => {
  const chatCompletion = await getGroqChatCompletion();
  res.json(chatCompletion.choices[0]?.message);
  console.log(chatCompletion.choices[0]?.message?.content || "");
});

app.listen(4000, () => console.log("Server running on port 4000"));
