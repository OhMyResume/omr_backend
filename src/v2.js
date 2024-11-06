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
  experience: Array<{
    position: string;
    company: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
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
  experience: [],
  skills: {
    programmingLanguages: [],
    toolsAndFrameworks: [],
    languages: [],
  },
};

const systemPrompt = {
  role: "system",
  content: `You are a friendly resume builder assistant. Your task is to help users create a professional resume.
  
  Important instructions:
  1. Ask only ONE question at a time
  2. Start by asking for their name
  3. Then ask for their email
  4. Then ask for their phone number
  5. Then ask for their current position
  6. Wait for each response before asking the next question
  7. Be conversational and professional
  8. Don't provide multiple questions or options at once
  
  Base your questions on this schema: ${resumeSchemaInterface}
  
  Start by greeting the user and asking for their name.`,
};

const chatHistory = [systemPrompt];

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

function extractInformation(userInput, currentQuestion) {
  // Simple information extraction based on current question context
  const input = userInput.toLowerCase();

  if (currentQuestion.includes("name")) {
    return { field: "personalInfo.name", value: userInput.trim() };
  } else if (currentQuestion.includes("email")) {
    const emailMatch = input.match(/\S+@\S+\.\S+/);
    return {
      field: "personalInfo.email",
      value: emailMatch ? emailMatch[0] : userInput.trim(),
    };
  } else if (currentQuestion.includes("phone")) {
    const phoneMatch = input.match(/[\d\s\-\(\)]+/);
    return {
      field: "personalInfo.phone",
      value: phoneMatch ? phoneMatch[0].trim() : userInput.trim(),
    };
  } else if (
    currentQuestion.includes("position") ||
    currentQuestion.includes("job")
  ) {
    return { field: "applyingFor", value: userInput.trim() };
  }

  return null;
}

function updateResumeData(field, value) {
  if (!field || !value) return;

  try {
    const fieldPath = field.split(".");
    let current = resumeData;

    for (let i = 0; i < fieldPath.length - 1; i++) {
      if (!current[fieldPath[i]]) {
        current[fieldPath[i]] = {};
      }
      current = current[fieldPath[i]];
    }

    current[fieldPath[fieldPath.length - 1]] = value;
  } catch (error) {
    console.error("Error updating resume data:", error);
  }
}

let lastQuestion = "";

async function startConversation() {
  try {
    const initialMessage =
      "Hello! I'm here to help you create a professional resume. What's your name?";
    lastQuestion = initialMessage;

    console.log("\nAssistant:", initialMessage);
    askQuestion();
  } catch (error) {
    console.error("Error starting conversation:", error);
    readline.close();
  }
}

function askQuestion() {
  readline.question("\nYou: ", async (userInput) => {
    if (
      userInput.toLowerCase() === "exit" ||
      userInput.toLowerCase() === "quit"
    ) {
      console.log("\nFinal Resume Data:");
      console.log(JSON.stringify(resumeData, null, 2));
      readline.close();
      return;
    }

    // Extract and update information based on the last question
    const extractedInfo = extractInformation(userInput, lastQuestion);
    if (extractedInfo) {
      updateResumeData(extractedInfo.field, extractedInfo.value);
    }

    chatHistory.push({ role: "user", content: userInput });

    try {
      const response = await client.chat.completions.create({
        model: "llama3-70b-8192",
        messages: chatHistory,
        max_tokens: 150,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0].message.content;
      lastQuestion = assistantMessage;

      chatHistory.push({
        role: "assistant",
        content: assistantMessage,
      });

      console.log("\nAssistant:", assistantMessage);
      askQuestion();
    } catch (error) {
      console.error("Error in conversation:", error);
      console.log("\nWould you like to try again? (yes/no)");

      readline.question("", (answer) => {
        if (answer.toLowerCase().startsWith("y")) {
          askQuestion();
        } else {
          console.log("\nFinal Resume Data:");
          console.log(JSON.stringify(resumeData, null, 2));
          readline.close();
        }
      });
    }
  });
}

// Check for API key
if (!process.env.GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY not found in environment variables");
  console.log("Please create a .env file with your GROQ_API_KEY");
  process.exit(1);
}

// Start the conversation
console.log("Starting Resume Builder (type 'exit' or 'quit' to finish)...\n");
startConversation();
