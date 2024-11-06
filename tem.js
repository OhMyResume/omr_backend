const express = require("express");
const Groq = require("groq-sdk");
const { ZepClient } = require("@getzep/zep-cloud");
// dotenv conf
require("dotenv").config();

const app = express();
app.use(express.json());

// Initialize GROQ and Zep AI clients
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const zepClient = new ZepClient({ apiKey: process.env.OMR_KEY });

const exampleMessagesAndResponses = [
  {
    sender: "bot",
    content: "Hello! I'm here to help you build your resume. What's your name?",
  },
  {
    sender: "user",
    content: "Hi, my name is John Doe.",
    updateField: "name",
    updateValue: "John Doe",
  },
  {
    sender: "bot",
    content: "Great to meet you, John! What's your current job title?",
    updateField: "title",
    updateValue: "Senior Software Engineer",
  },
  { sender: "user", content: "I'm a Senior Software Engineer." },
  {
    sender: "bot",
    content:
      "Excellent! Let's add your contact information. What's your email address?",
    updateField: "email",
    updateValue: "john.doe@example.com",
  },
  { sender: "user", content: "My email is john.doe@example.com" },
  {
    sender: "bot",
    content: "Got it. And your phone number?",
    updateField: "phone",
    updateValue: "(123) 456-7890",
  },
  { sender: "user", content: "It's (123) 456-7890" },
  {
    sender: "bot",
    content: "Perfect. Where are you located?",
    updateField: "location",
    updateValue: "New York, NY",
  },
  { sender: "user", content: "I'm in New York, NY." },
  {
    sender: "bot",
    content: "Great. Do you have a professional website?",
    updateField: "website",
    updateValue: "www.johndoe.com",
  },
  { sender: "user", content: "Yes, it's www.johndoe.com" },
  {
    sender: "bot",
    content:
      "Excellent! Now, let's create a professional summary. Can you tell me about your background and career goals?",
    updateField: "summary",
    updateValue:
      "Experienced software engineer with 5 years of expertise in web development, specializing in building scalable and efficient applications. Proven track record of leading development teams and implementing innovative solutions. Seeking a leadership role to leverage technical skills and mentoring abilities to drive project success and team growth.",
  },
  {
    sender: "user",
    content:
      "I'm a software engineer with 5 years of experience. I specialize in web development and I'm looking to move into a leadership role.",
  },
  {
    sender: "bot",
    content:
      "Great summary! Let's move on to your work experience. What's your current job?",
    updateField: "experience",
    updateValue: [
      {
        title: "Senior Software Engineer",
        company: "Tech Innovations Inc.",
        period: "2018 - Present",
        achievements: [
          "Led the development of a cloud-based IoT platform, increasing company revenue by 25%",
          "Mentored junior developers, improving team productivity and code quality",
          "Implemented agile methodologies, reducing project delivery time and enhancing collaboration",
          "Architected and developed scalable web applications using modern JavaScript frameworks",
        ],
      },
    ],
  },
  {
    sender: "user",
    content:
      "I'm currently a Senior Software Engineer at Tech Innovations Inc. since 2018. I've led several major projects and mentored junior developers.",
  },
  {
    sender: "bot",
    content:
      "Impressive! Let's add your education. What's your highest degree?",
    updateField: "education",
    updateValue: [
      {
        degree: "Master of Science in Computer Science",
        school: "Tech University",
        period: "2013 - 2015",
      },
    ],
  },
  {
    sender: "user",
    content:
      "I have a Master's degree in Computer Science from Tech University, completed in 2015.",
  },
  {
    sender: "bot",
    content: "Excellent. Finally, let's list your top skills.",
    updateField: "skills",
    updateValue: ["JavaScript", "React", "Node.js", "Python", "AWS"],
  },
  {
    sender: "user",
    content: "My top skills are JavaScript, React, Node.js, Python, and AWS.",
  },
  {
    sender: "bot",
    content: "Great! I've added those skills. Do you have any certifications?",
    updateField: "certifications",
    updateValue: ["AWS Certified Developer", "Certified Scrum Master"],
  },
  {
    sender: "user",
    content:
      "Yes, I'm an AWS Certified Developer and a Certified Scrum Master.",
  },
  {
    sender: "bot",
    content:
      "Perfect! I've added those certifications to your resume. Is there anything else you'd like to add or modify?",
  },
];

async function generateAIResponse(prompt, context) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an AI assistant helping build a resume. Ask concise, relevant questions to fill out the resume schema ${resumeSchemaInterface}.Example: ${JSON.stringify(
          exampleMessagesAndResponses
        )}`,
      },
      { role: "user", content: context },
      { role: "user", content: prompt },
    ],
    model: "llama3-large-v1",
    temperature: 0.5,
    max_tokens: 100,
  });

  return completion.choices[0]?.message?.content || "";
}

app.post("/start-chat", async (req, res) => {
  const sessionId = Date.now().toString();
  await zepClient.memory.add(sessionId, {
    messages: [{ role: "system", content: "Resume building session started." }],
  });
  res.json({ sessionId, message: "Chat session started. What's your name?" });
});

app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  // Retrieve conversation history from Zep
  const memory = await zepClient.memory.get(sessionId);
  const context = memory.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  // Generate AI response using GROQ
  const aiResponse = await generateAIResponse(message, context);

  // Update resume (implement this function based on AI response)
  updateResume(sessionId, message, aiResponse);

  // Store new memory in Zep
  await zepClient.memory.add(sessionId, {
    messages: [
      { role: "human", content: message },
      { role: "ai", content: aiResponse },
    ],
  });

  // Send response and updated resume
  res.json({ aiResponse, updatedResume: getResume(sessionId) });
});

app.get("/resume/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  // Implement getResume function to retrieve current resume data
  const resume = getResume(sessionId);
  res.json(resume);
});

// Implement WebSocket for real-time updates

app.listen(4000, () => console.log("Server running on port 3000"));

// TODO: Implement these functions
function updateResume(sessionId, message, aiResponse) {
  // Logic to update the resume based on AI response
}

function getResume(sessionId) {
  // Logic to retrieve the current resume data
  return {}; // Placeholder return
}