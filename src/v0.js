// const Groq = require("groq-sdk");
// require("dotenv").config();
// // import resumeSchemaInterface from "./resumeSchemaInterface";

// const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// // console.log(resumeSchemaInterface);

// const resumeSchemaInterface = `Resume {
//   personalInfo: {
//     name: string;
//     email: string;
//     phone: string;
//     website?: string;
//   };
//   applyingFor: string;
//   education: Array<{
//     institution: string;
//     location: string;
//     degree: string;
//     major: string;
//     startDate: string;
//     endDate: string;
//   }>;
//   publications: Array<{
//     title: string;
//     authors: string[];
//     conference: string;
//     year: number;
//     award?: string;
//   }>;
//   experience: Array<{
//     position: string;
//     company: string;
//     startDate: string;
//     endDate: string;
//     responsibilities: string[];
//   }>;
//   awards: Array<{
//     name: string;
//     year: number;
//   }>;
//   skills: {
//     programmingLanguages: string[];
//     toolsAndFrameworks: string[];
//     languages: Array<{
//       language: string;
//       proficiency: string;
//     }>;
//   };
// }`;

// const exampleMessagesAndResponses = [
//   {
//     sender: "bot",
//     content: "Hello! I'm here to help you build your resume. What's your name?",
//   },
//   {
//     sender: "user",
//     content: "Hi, my name is John Doe.",
//     updateField: "name",
//     updateValue: "John Doe",
//   },
//   {
//     sender: "bot",
//     content: "Great to meet you, John! What's your current job title?",
//     updateField: "title",
//     updateValue: "Senior Software Engineer",
//   },
//   { sender: "user", content: "I'm a Senior Software Engineer." },
//   {
//     sender: "bot",
//     content:
//       "Excellent! Let's add your contact information. What's your email address?",
//     updateField: "email",
//     updateValue: "john.doe@example.com",
//   },
//   { sender: "user", content: "My email is john.doe@example.com" },
//   {
//     sender: "bot",
//     content: "Got it. And your phone number?",
//     updateField: "phone",
//     updateValue: "(123) 456-7890",
//   },
//   { sender: "user", content: "It's (123) 456-7890" },
//   {
//     sender: "bot",
//     content: "Perfect. Where are you located?",
//     updateField: "location",
//     updateValue: "New York, NY",
//   },
//   { sender: "user", content: "I'm in New York, NY." },
//   {
//     sender: "bot",
//     content: "Great. Do you have a professional website?",
//     updateField: "website",
//     updateValue: "www.johndoe.com",
//   },
//   { sender: "user", content: "Yes, it's www.johndoe.com" },
//   {
//     sender: "bot",
//     content:
//       "Excellent! Now, let's create a professional summary. Can you tell me about your background and career goals?",
//     updateField: "summary",
//     updateValue:
//       "Experienced software engineer with 5 years of expertise in web development, specializing in building scalable and efficient applications. Proven track record of leading development teams and implementing innovative solutions. Seeking a leadership role to leverage technical skills and mentoring abilities to drive project success and team growth.",
//   },
//   {
//     sender: "user",
//     content:
//       "I'm a software engineer with 5 years of experience. I specialize in web development and I'm looking to move into a leadership role.",
//   },
//   {
//     sender: "bot",
//     content:
//       "Great summary! Let's move on to your work experience. What's your current job?",
//     updateField: "experience",
//     updateValue: [
//       {
//         title: "Senior Software Engineer",
//         company: "Tech Innovations Inc.",
//         period: "2018 - Present",
//         achievements: [
//           "Led the development of a cloud-based IoT platform, increasing company revenue by 25%",
//           "Mentored junior developers, improving team productivity and code quality",
//           "Implemented agile methodologies, reducing project delivery time and enhancing collaboration",
//           "Architected and developed scalable web applications using modern JavaScript frameworks",
//         ],
//       },
//     ],
//   },
//   {
//     sender: "user",
//     content:
//       "I'm currently a Senior Software Engineer at Tech Innovations Inc. since 2018. I've led several major projects and mentored junior developers.",
//   },
//   {
//     sender: "bot",
//     content:
//       "Impressive! Let's add your education. What's your highest degree?",
//     updateField: "education",
//     updateValue: [
//       {
//         degree: "Master of Science in Computer Science",
//         school: "Tech University",
//         period: "2013 - 2015",
//       },
//     ],
//   },
//   {
//     sender: "user",
//     content:
//       "I have a Master's degree in Computer Science from Tech University, completed in 2015.",
//   },
//   {
//     sender: "bot",
//     content: "Excellent. Finally, let's list your top skills.",
//     updateField: "skills",
//     updateValue: ["JavaScript", "React", "Node.js", "Python", "AWS"],
//   },
//   {
//     sender: "user",
//     content: "My top skills are JavaScript, React, Node.js, Python, and AWS.",
//   },
//   {
//     sender: "bot",
//     content: "Great! I've added those skills. Do you have any certifications?",
//     updateField: "certifications",
//     updateValue: ["AWS Certified Developer", "Certified Scrum Master"],
//   },
//   {
//     sender: "user",
//     content:
//       "Yes, I'm an AWS Certified Developer and a Certified Scrum Master.",
//   },
//   {
//     sender: "bot",
//     content:
//       "Perfect! I've added those certifications to your resume. Is there anything else you'd like to add or modify?",
//   },
// ];

// const responseType = `Response: {
//   "type": "incomplete",
//   "nextQuestion":"",
//   "finalResume": {
//     "personalInfo": {
//       "name": "",
//       "email": "",
//       "phone": "",
//       "website": ""
//     },
//     "applyingFor": "",
//     "summary": "",
//     "education": [
//       {
//         "institution": "",
//         "location": "",
//         "degree": "",
//         "major": "",
//         "startDate": "",
//         "endDate": ""
//       }
//     ],
//     "publications": [{
//       "title": "",
//       "authors": [],
//       "conference": "",
//       "year": 0,
//       "award": ""
//     }],
//     "experience": [{
//       "position": "",
//       "company": "",
//       "startDate": "",
//       "endDate": "",
//       "responsibilities": [
//         ""]}],
//     "awards": [{
//       "title": "",
//       "year": 0
//     }],
//     "certifications": [""],
//     "skills": {
//       "programmingLanguages": [""],
//       "toolsAndFrameworks": [""],
//       "languages": [""]
//     }
//   }
// }`;

// const stringMessagesAndResponses = JSON.stringify(exampleMessagesAndResponses);

// const systemPrompt = {
//   role: "system",
//   content: `Your are a resume builder helper, you need to ask one by one questions to fill out the resume schema ${resumeSchemaInterface} like a person.ask one question at a time.here is the expalale converstion and user responce act like this ${stringMessagesAndResponses}.Your Response type is ${responseType}.`,
// };

// const chatHistory = [systemPrompt];

// const readline = require("readline").createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// function askQuestion() {
//   readline.question("You: ", async (userInput) => {
//     chatHistory.push({ role: "user", content: userInput });

//     try {
//       const response = await client.chat.completions.create({
//         model: "llama3-70b-8192",
//         messages: chatHistory,
//         max_tokens: 100,
//         temperature: 0.5,
//       });

//       chatHistory.push({
//         role: "assistant",
//         content: response.choices[0].message.content,
//       });

//       console.log("Assistant:", response.choices[0].message.content);

//       askQuestion();
//     } catch (error) {
//       console.error("Error:", error);
//       readline.close();
//     }
//   });
// }

// askQuestion();
