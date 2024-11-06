const Groq = require("groq-sdk");
require("dotenv").config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

// Template for tracking resume data
const resumeData = {
  personalInfo: {
    name: "",
    email: "",
    phone: "",
    website: "",
  },
  applyingFor: "",
  education: [],
  publications: [],
  experience: [],
  awards: [],
  skills: {
    programmingLanguages: [],
    toolsAndFrameworks: [],
    languages: [],
  },
};

const systemPrompt = {
  role: "system",
  content: `You are a professional resume builder assistant. Your task is to:
  1. Start the conversation by introducing yourself and asking for the user's name
  2. Guide the user through building their resume by asking one question at a time
  3. Process their responses and store relevant information
  4. Ask follow-up questions when needed to get complete information
  5. Follow the schema: ${resumeSchemaInterface}
  6. Be conversational and professional
  7. Provide guidance and suggestions when appropriate
  
  Structure your responses as JSON in this format:
  {
    "type": "question" | "confirmation" | "complete",
    "message": "Your conversational message here",
    "field": "path.to.field.to.update",
    "processedValue": "extracted value from user's response",
    "nextQuestion": "Next question to ask"
  }`,
};

const chatHistory = [systemPrompt];

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function startConversation() {
  try {
    // Initialize conversation with AI's first message
    const response = await client.chat.completions.create({
      model: "llama3-70b-8192",
      messages: chatHistory,
      max_tokens: 150,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0].message.content;
    chatHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    console.log("Assistant:", JSON.parse(assistantMessage).message);
    askQuestion();
  } catch (error) {
    console.error("Error starting conversation:", error);
    readline.close();
  }
}

function updateResumeData(field, value) {
  const fieldPath = field.split(".");
  let current = resumeData;

  for (let i = 0; i < fieldPath.length - 1; i++) {
    if (!current[fieldPath[i]]) {
      current[fieldPath[i]] = {};
    }
    current = current[fieldPath[i]];
  }

  current[fieldPath[fieldPath.length - 1]] = value;
}

function askQuestion() {
  readline.question("You: ", async (userInput) => {
    chatHistory.push({ role: "user", content: userInput });

    try {
      const response = await client.chat.completions.create({
        model: "llama3-70b-8192",
        messages: chatHistory,
        max_tokens: 150,
        temperature: 0.7,
      });

      const assistantResponse = JSON.parse(response.choices[0].message.content);

      // Update resume data if there's a processed value
      if (assistantResponse.field && assistantResponse.processedValue) {
        updateResumeData(
          assistantResponse.field,
          assistantResponse.processedValue
        );
      }

      chatHistory.push({
        role: "assistant",
        content: response.choices[0].message.content,
      });

      console.log("Assistant:", assistantResponse.message);

      if (assistantResponse.type === "complete") {
        console.log("\nFinal Resume Data:");
        console.log(JSON.stringify(resumeData, null, 2));
        readline.close();
        return;
      }

      askQuestion();
    } catch (error) {
      console.error("Error:", error);
      readline.close();
    }
  });
}

// Start the conversation
startConversation();
