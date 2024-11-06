const express = require("express");
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = "llama3-8b-8192";

const resumeSchemaInterface = `Resume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    website?: string;
  };
  applyingFor: string;
  education: Array<{
    institution: string;
    location: string;
    degree: string;
    major: string;
    startDate: string;
    endDate: string;
  }>;
  publications: Array<{
    title: string;
    authors: string[];
    conference: string;
    year: number;
    award?: string;
  }>;
  experience: Array<{
    position: string;
    company: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
  }>;
  awards: Array<{
    name: string;
    year: number;
  }>;
  skills: {
    programmingLanguages: string[];
    toolsAndFrameworks: string[];
    languages: Array<{
      language: string;
      proficiency: string;
    }>;
  };
}`;

app.get("/chat", async (req, res) => {
  const userMessage = req.body;
  const resumeDataResponse = await groq.chat.completions.create({
    messages: [
      {
        role: "assistant",
        content: `Your are a resume builder helper, you need to ask one by one questions to fill out the resume schema ${resumeSchemaInterface} like a person.ask one question at a time.`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    model: model,
  });

  res.json(resumeDataResponse.choices[0]?.message);

  // console.log(resumeDataResponse.choices[0]?.message?.content);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} `));
