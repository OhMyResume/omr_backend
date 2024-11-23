require("dotenv").config();

module.exports = {
  port: process.env.PORT || 8000,
  groqApiKey: process.env.GROQ_API_KEY,
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1", // Use IP instead of localhost
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: function (times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    reconnectOnError: function (err) {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  },
  limits: {
    maxConnections: 100,
    maxConnectionsPerIP: 5,
    sessionTTL: 3600, // 1 hour
    messageRateLimit: 60, // messages per minute
  },
};
