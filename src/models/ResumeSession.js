const Groq = require("groq-sdk");
const config = require("../config/config");
const sessionStore = require("../utils/sessionStore");
const { resumeTemplate, questionSequence } = require("../utils/templates");
const { v4: uuidv4 } = require("uuid");
const WebSocket = require("ws");

const groq = new Groq({
  apiKey: config.groqApiKey,
});

class ResumeSession {
  constructor(ws) {
    this.ws = ws;
    this.sessionId = null;
    this.currentQuestionIndex = 0;
    this.resume = { ...resumeTemplate };
    this.hasStarted = false;
  }

  async initialize(existingSessionId = null) {
    if (existingSessionId) {
      const existingSession = await sessionStore.getSession(existingSessionId);

      if (existingSession) {
        console.log("Resuming existing session:", existingSessionId);
        this.sessionId = existingSessionId;
        this.currentQuestionIndex = existingSession.currentQuestionIndex || 0;
        this.resume = existingSession.resume;
        return true; // Return true if session was restored
      }
    }

    // Initialize a new session if no existing session is found
    console.log("Initializing new session...");
    this.sessionId = uuidv4();
    this.currentQuestionIndex = 0;
    await this.saveSession();
    return false; // Return false if new session was created
  }

  async saveSession() {
    await sessionStore.updateSession(this.sessionId, {
      currentQuestionIndex: this.currentQuestionIndex,
      resume: this.resume,
      lastActive: Date.now(),
    });
  }

  async start(sessionId = null) {
    if (this.hasStarted) {
      return; // Prevent multiple starts
    }

    const sessionRestored = await this.initialize(sessionId);

    // Only send the first question if:
    // 1. This is a new session (currentQuestionIndex === 0) OR
    // 2. This is a restored session but we haven't completed all questions
    if (
      !sessionRestored ||
      (this.currentQuestionIndex > 0 &&
        this.currentQuestionIndex < questionSequence.length)
    ) {
      const nextQuestion = questionSequence[this.currentQuestionIndex];
      console.log(
        `Sending question ${this.currentQuestionIndex}:`,
        nextQuestion
      );
      this.sendQuestion(nextQuestion);
    }

    this.hasStarted = true;
  }

  sendQuestion(questionData) {
    const message = {
      type: "question",
      data: {
        ...questionData,
        sessionId: this.sessionId,
      },
      currentResume: this.resume,
    };

    // Add a small delay to prevent race conditions
    setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }, 100);
  }

  async updateResumeField(field, value) {
    const fieldPath = field.split(".");
    let current = this.resume;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      if (!current[fieldPath[i]]) {
        current[fieldPath[i]] = {};
      }
      current = current[fieldPath[i]];
    }
    current[fieldPath[fieldPath.length - 1]] = value;
    await this.saveSession();
  }

  async processExperience(answer) {
    const prompt = `
      Extract experience details from text and format as JSON array. Text must contain job title, company, period, and achievements.
      Input: "${answer}"
      Required format:
      [
        {
          "title": "Job Title",
          "company": "Company Name", 
          "period": "YYYY-YYYY",
          "achievements": ["Achievement 1", "Achievement 2"]
        }
      ]
      
      Use exact text from input when possible. Split achievements into separate array items.`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a parser that converts job experience text into structured JSON. Only output valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "gemma2-9b-it",
        temperature: 0.1,
        max_tokens: 1024,
      });

      const result = completion.choices[0].message.content;
      // Validate JSON structure
      const parsed = JSON.parse(result);
      if (
        !Array.isArray(parsed) ||
        !parsed[0]?.title ||
        !parsed[0]?.company ||
        !parsed[0]?.period ||
        !Array.isArray(parsed[0]?.achievements)
      ) {
        throw new Error("Invalid experience format");
      }
      return parsed;
    } catch (error) {
      throw new Error(
        "Please provide your role, company name, work period, and key achievements."
      );
    }
  }

  async processEducation(answer) {
    const prompt = `
      Convert education text to JSON array, fixing spelling and formatting:
      Input: "${answer}"
      Required output format:
      [
        {
          "degree": "Name of Degree in Computer Science/IT",
          "school": "Full School Name",
          "period": "YYYY-YYYY"
        }
      ]
      Rules:
      - Fix common typos (e.g. "ploytchnic" -> "Polytechnic")
      - Format school name properly
      - Use standard degree names (e.g. "Computer Science" not "coputerscince")
      - Extract or infer period if given`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a parser that converts education details into structured JSON, fixing any typos or formatting issues.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "gemma2-9b-it",
        temperature: 0.1,
        max_tokens: 1024,
      });

      const result = completion.choices[0].message.content;
      const parsed = JSON.parse(result);

      // Validate structure
      if (
        !Array.isArray(parsed) ||
        !parsed[0]?.degree ||
        !parsed[0]?.school ||
        !parsed[0]?.period
      ) {
        throw new Error("Invalid education format");
      }

      return parsed;
    } catch (error) {
      throw new Error(
        "Please provide your school, degree and study period in a clear format."
      );
    }
  }

  async processSkills(answer) {
    const prompt = `
    Convert text to JSON array of professional skills:
    Input: "${answer}"
    Rules:
    - Extract only technical/professional skills
    - Return as JSON array of strings
    - Normalize skill names
    - Limit to most relevant skills
    Format: ["Skill1", "Skill2", ...]`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "assistant", content: prompt }],
        model: "gemma2-9b-it",
        temperature: 0.3,
        max_tokens: 1024,
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      throw new Error("Please list your key professional skills.");
    }
  }

  async processCertifications(answer) {
    const prompt = `
    Convert certification information to JSON array:
    Input: "${answer}"
    Rules:
    - Extract only formal certifications
    - Return as JSON array of strings
    - Include certification provider if mentioned
    - Return empty array if no certifications found
    Format: ["Certification1", "Certification2", ...]`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "assistant", content: prompt }],
        model: "gemma2-9b-it",
        temperature: 0.3,
        max_tokens: 1024,
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      return []; // Return empty array if no certifications
    }
  }

  async processPersonalInfo(field, answer) {
    const prompts = {
      "personalInfo.name": `
        Extract full name from: "${answer}"
        Rules:
        - Return only the name without any prefixes
        - Return as plain text, not JSON
        - If no name found, return "Unknown"`,

      "personalInfo.title": `
        Extract job title from: "${answer}"
        Rules:
        - Return single professional title
        - Return as plain text without any prefixes
        - If no title found, return "Professional"`,
    };

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "assistant", content: prompts[field] }],
        model: "gemma2-9b-it",
        temperature: 0.1,
        max_tokens: 100,
      });

      const result = completion.choices[0].message.content
        .trim()
        .replace(/^(Answer:|Solution:)\s*/i, ""); // Remove "Answer:" prefix

      if (result === "Unknown" || result === "Professional") {
        throw new Error(`Please provide your ${field.split(".")[1]}.`);
      }
      return result;
    } catch (error) {
      throw new Error(
        `Could not process ${field.split(".")[1]}. Please try again.`
      );
    }
  }

  async processSummary(answer) {
    const prompt = `
    Create professional summary from:
    "${answer}"
    Rules:
    - 2-3 sentences maximum
    - Include years of experience if mentioned
    - Focus on key skills and achievements
    - Make it achievement-oriented
    - Return as plain text, not JSON`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "assistant", content: prompt }],
        model: "gemma2-9b-it",
        temperature: 0.3,
        max_tokens: 200,
      });

      const result = completion.choices[0].message.content.trim();
      if (result.length < 50) {
        throw new Error(
          "Please provide more details about your professional background."
        );
      }
      return result;
    } catch (error) {
      throw new Error("Please provide a more detailed professional summary.");
    }
  }

  async processField(field, answer) {
    switch (field) {
      case "experience":
        return await this.processExperience(answer);
      case "education":
        return await this.processEducation(answer);
      case "skills":
        return await this.processSkills(answer);
      case "certifications":
        return await this.processCertifications(answer);
      case "personalInfo.name":
      case "personalInfo.title":
        return await this.processPersonalInfo(field, answer);
      case "summary":
        return await this.processSummary(answer);
      default:
        return answer;
    }
  }

  async processAnswer(answer) {
    try {
      const currentQuestion = questionSequence[this.currentQuestionIndex];
      let processedValue = await this.processField(
        currentQuestion.field,
        answer
      );
      await this.updateResumeField(currentQuestion.field, processedValue);

      this.ws.send(
        JSON.stringify({
          type: "update",
          data: {
            field: currentQuestion.field,
            value: processedValue,
            currentResume: this.resume,
            sessionId: this.sessionId,
          },
        })
      );

      this.currentQuestionIndex++;
      await this.saveSession();

      if (this.currentQuestionIndex < questionSequence.length) {
        this.sendQuestion(questionSequence[this.currentQuestionIndex]);
      } else {
        this.ws.send(
          JSON.stringify({
            type: "complete",
            data: {
              message: "Your resume is complete",
              finalResume: this.resume,
              sessionId: this.sessionId,
            },
          })
        );
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    console.error("Error during session:", error);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "error",
          data: { message: error.message || "An error occurred" },
        })
      );
    }
  }

  async cleanup() {
    if (this.sessionId) {
      await sessionStore.deleteSession(this.sessionId);
    }
  }
}

module.exports = ResumeSession;
