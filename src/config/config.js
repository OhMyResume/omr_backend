require("dotenv").config();

module.exports = {
  port: process.env.PORT || 8000,
  groqApiKey: process.env.GROQ_API_KEY,
};
