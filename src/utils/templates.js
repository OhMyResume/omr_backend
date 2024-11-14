const resumeTemplate = {
  personalInfo: {
    name: "",
    title: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  certifications: [],
};

const questionSequence = [
  {
    id: "name",
    question: "Hello! I'm here to help build your resume. What's your name?",
    field: "personalInfo.name",
    type: "text",
  },
  {
    id: "title",
    question: "What's your current job title or professional role?",
    field: "personalInfo.title",
    type: "text",
  },
  {
    id: "summary",
    question: "Tell me about yourself and your professional background.",
    field: "summary",
    type: "text",
  },
  {
    id: "experience",
    question:
      "Tell me about your work experience. Include your role, company, duration, and key achievements.",
    field: "experience",
    type: "text",
  },
  {
    id: "education",
    question:
      "What's your educational background? Include degrees, schools, and graduation dates.",
    field: "education",
    type: "text",
  },
  {
    id: "skills",
    question:
      "What are your key professional skills and technical competencies?",
    field: "skills",
    type: "text",
  },
  {
    id: "certifications",
    question:
      "Do you have any professional certifications or licenses? If so, please list them.",
    field: "certifications",
    type: "text",
  },
];

module.exports = {
  resumeTemplate,
  questionSequence,
};
