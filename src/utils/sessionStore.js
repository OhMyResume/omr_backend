const Redis = require("ioredis");
const config = require("../config/config");

class SessionStore {
  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: 3,
    });
  }

  async createSession(sessionId, data) {
    await this.redis.setex(
      `resume_session:${sessionId}`,
      3600, // 1 hour expiry
      JSON.stringify(data)
    );
  }

  async getSession(sessionId) {
    const data = await this.redis.get(`resume_session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async updateSession(sessionId, data) {
    await this.redis.setex(
      `resume_session:${sessionId}`,
      3600,
      JSON.stringify(data)
    );
  }

  async deleteSession(sessionId) {
    await this.redis.del(`resume_session:${sessionId}`);
  }
}

module.exports = new SessionStore();
