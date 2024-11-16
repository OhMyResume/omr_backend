const Groq = require("groq-sdk");
const config = require("../config/config");
const { resumeTemplate, questionSequence } = require("../utils/templates");

const groq = new Groq({
  apiKey: config.groqApiKey,
});

class ResumeSession {
  constructor(ws) {
    this.ws = ws;
    this.currentQuestionIndex = 0;
    this.resume = { ...resumeTemplate };
  }

  async start() {
    this.sendQuestion(questionSequence[0]);
  }

  sendQuestion(questionData) {
    const message = {
      type: "question",
      data: questionData,
      currentResume: this.resume,
    };
    setTimeout(() => {
      this.ws.send(JSON.stringify(message));
    }, 1000);
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
  }
  async processExperience(answer) {
    const prompt = `
    Extract work experience information from this text and format it as a JSON array of experiences.
    Each experience should have: title, company, period, and achievements (as an array).
    Text: "${answer}"
    
    Respond only with the JSON array. Example format:
    [
      {
        "title": "Senior Developer",
        "company": "Tech Corp",
        "period": "2020-2023",
        "achievements": ["Led team of 5 developers", "Increased performance by 40%"]
      }
    ]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "assistant", content: prompt }],
      model: "gemma2-9b-it",
      temperature: 0.3,
      max_tokens: 1024,
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  async processEducation(answer) {
    const prompt = `
    Extract education information from this text and format it as a JSON array.
    Each education entry should have: degree, school, and period.
    Text: "${answer}"
    
    Respond only with the JSON array. Example format:
    [
      {
        "degree": "Bachelor of Science in Computer Science",
        "school": "University of Technology",
        "period": "2016-2020"
      }
    ]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "assistant", content: prompt }],
      model: "gemma2-9b-it",
      temperature: 0.3,
      max_tokens: 1024,
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  async processSkills(answer) {
    const prompt = `
    Extract professional skills from this text and return them as a JSON array of strings.
    Text: "${answer}"
    
    Respond only with the JSON array. Example:
    ["JavaScript", "React", "Node.js", "Project Management"]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "assistant", content: prompt }],
      model: "gemma2-9b-it",
      temperature: 0.3,
      max_tokens: 1024,
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  async processCertifications(answer) {
    const prompt = `
    Extract certifications from this text and return them as a JSON array of strings.
    If no certifications are mentioned, return an empty array.
    Text: "${answer}"
    
    Respond only with the JSON array. Example:
    ["AWS Certified Solutions Architect", "PMP Certification"]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "assistant", content: prompt }],
      model: "gemma2-9b-it",
      temperature: 0.3,
      max_tokens: 1024,
    });

    return JSON.parse(completion.choices[0].message.content);
  }
  async processPersonalInfo(field, answer) {
    let prompt;
    switch (field) {
      case "personalInfo.name":
        prompt = `Extract only the person's name from this text. If no name is found, respond with "NO_NAME_FOUND". 
                 only extract the name, not the rest of the text 
                 respond with the name only in camel case
                 no double quotes and no json
                 Example: "hi my name is John Doe" -> "John Doe"
                 Text: "${answer}"`;
        break;
      // case "personalInfo.email":
      //   prompt = `Extract only the email address from this text. If no email is found, respond with "NO_EMAIL_FOUND".
      //            Example: "my email is john@example.com" -> "john@example.com"
      //            if text is directly an email address, respond with that address
      //            Text: "${answer}"`;
      //   break;
      // case "personalInfo.phone":
      //   prompt = `Extract only the phone number from this text. If no phone number is found, respond with "NO_PHONE_FOUND".
      //            Example: "my number is 1234567890" -> "1234567890"
      //            if text is directly a phone number, respond with that number
      //            Text: "${answer}"`;
      //   break;
      case "personalInfo.title":
        prompt = `Extract only the job title from this text. Fix any typos. If no title is found, respond with "NO_TITLE_FOUND".
                 Example: "I work as a Senior Software Engineer" -> "Senior Software Engineer"
                 only extract the title, not the rest of the text
                 if text is directly a job title, respond with that only title in camel case
                 no double quotes and no json 
                 Text: "${answer}"`;

        break;
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: "assistant", content: prompt }],
      model: "gemma2-9b-it",
      max_tokens: 100,
    });

    const result = completion.choices[0].message.content.trim();

    // Handle cases where no valid data was found
    if (result.includes("NO_") && result.includes("_FOUND")) {
      throw new Error(
        `Could not find valid ${
          field.split(".")[1]
        } in your response. Please try again.`
      );
    }

    return result;
  }

  async processSummary(answer) {
    if (answer.toLowerCase() === "hello" || answer.length < 10) {
      throw new Error(
        "Please provide more details about your professional background so I can create a meaningful summary."
      );
    }

    const prompt = `
  Generate a concise, professional summary emphasizing the candidate's experience, skills, and career goals.
  Start the response directly with the summary content without any introductory phrases or additional explanations.
  Limit the summary to 3 sentences.
  Text: "${answer}"
 `;
    const completion = await groq.chat.completions.create({
      messages: [{ role: "assistant", content: prompt }],
      model: "gemma2-9b-it",
      max_tokens: 100,
      temperature: 0.3,
    });

    const result = completion.choices[0].message.content.trim();

    if (result === "NO_SUMMARY_FOUND") {
      throw new Error(
        "Please provide more details about your professional background so I can create a meaningful summary."
      );
    }

    return result;
  }
  async processAnswer(answer) {
    const currentQuestion = questionSequence[this.currentQuestionIndex];
    console.log("Processing answer for question:", currentQuestion.id);
    console.log("Answer received:", answer);

    try {
      let processedValue;

      // Add input validation
      if (!answer || answer.trim().length === 0) {
        throw new Error("Please provide a response.");
      }

      // Process the answer based on the field type
      try {
        switch (currentQuestion.field) {
          case "experience":
            processedValue = await this.processExperience(answer);
            break;
          case "education":
            processedValue = await this.processEducation(answer);
            break;
          case "skills":
            processedValue = await this.processSkills(answer);
            break;
          case "certifications":
            processedValue = await this.processCertifications(answer);
            break;
          case "summary":
            processedValue = await this.processSummary(answer);
            break;
          default:
            if (currentQuestion.field.startsWith("personalInfo.")) {
              processedValue = await this.processPersonalInfo(
                currentQuestion.field,
                answer
              );
            }
        }

        // Validate processed value
        if (!processedValue) {
          throw new Error(
            "Could not process your response. Please try again with more details."
          );
        }

        // Update resume with processed value
        this.updateResumeField(currentQuestion.field, processedValue);

        // Send update to client
        setTimeout(() => {
          this.ws.send(
            JSON.stringify({
              type: "update",
              data: {
                field: currentQuestion.field,
                value: processedValue,
                currentResume: this.resume,
              },
            })
          );
        }, 2000);

        // If it's the first question and we got a NO_NAME_FOUND, ask again
        if (
          currentQuestion.id === "name" &&
          processedValue === "NO_NAME_FOUND"
        ) {
          this.ws.send(
            JSON.stringify({
              type: "question",
              data: {
                ...currentQuestion,
                question:
                  "I didn't catch your name. Could you please tell me your full name?",
              },
            })
          );
          return;
        }

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
                message:
                  "Great! Your resume is complete. Feel free to review and make any adjustments needed.",
                finalResume: this.resume,
              },
            })
          );
        }
      } catch (processingError) {
        // Send error message and ask the same question again
        this.ws.send(
          JSON.stringify({
            type: "error",
            data: {
              message: processingError.message,
            },
          })
        );
        // Ask the same question again
        this.sendQuestion(currentQuestion);
      }
    } catch (error) {
      console.error("Error in processAnswer:", error);
      this.ws.send(
        JSON.stringify({
          type: "error",
          data: {
            message:
              error.message || "Sorry, something went wrong. Please try again.",
          },
        })
      );
      // Ask the same question again
      this.sendQuestion(currentQuestion);
    }
  }
}

module.exports = ResumeSession;
