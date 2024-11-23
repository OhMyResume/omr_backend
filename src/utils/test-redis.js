const sessionStore = require("./sessionStore");

async function testRedisConnection() {
  try {
    // Test creating a session
    await sessionStore.createSession("test-session", {
      data: "test data",
    });
    console.log("Successfully created test session");

    // Test retrieving the session
    const session = await sessionStore.getSession("test-session");
    console.log("Retrieved session:", session);

    // Test deleting the session
    await sessionStore.deleteSession("test-session");
    console.log("Successfully deleted test session");

    process.exit(0);
  } catch (error) {
    console.error("Redis test failed:", error);
    process.exit(1);
  }
}

testRedisConnection();
