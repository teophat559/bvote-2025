/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import { jest } from "@jest/globals";

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.ENCRYPTION_KEY = "test-encryption-key-32-chars!!!";
process.env.ADMIN_KEY = "TEST_ADMIN_KEY_2025";
process.env.DATABASE_URL = "sqlite::memory:";

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during testing
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep errors visible
  debug: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Create test user credentials
  createTestUser: () => ({
    email: "test@example.com",
    password: "TestPass123!",
    name: "Test User",
  }),

  // Create admin credentials
  createTestAdmin: () => ({
    email: "admin@test.com",
    password: "AdminPass123!",
    adminKey: "TEST_ADMIN_KEY_2025",
  }),

  // Generate random email
  randomEmail: () =>
    `test${Math.random()
      .toString(36)
      .substr(2, 9)}@test.com`,

  // Generate strong password
  strongPassword: () => "StrongPass123!@#",

  // Wait for async operations
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Clean database (if needed)
  cleanDatabase: async () => {
    // Implementation would depend on your database setup
    console.log("Database cleaned for testing");
  },
};

// Mock external services
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
  })),
}));

jest.mock("twilio", () =>
  jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: "test-sms-sid" }),
    },
  }))
);

// Setup and teardown
beforeAll(async () => {
  console.log("🧪 Test suite starting...");
});

afterAll(async () => {
  console.log("🧪 Test suite completed");
});

beforeEach(async () => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset console mocks
  global.console.log.mockClear();
  global.console.info.mockClear();
  global.console.warn.mockClear();
  global.console.debug.mockClear();
});

afterEach(async () => {
  // Cleanup after each test
  await global.testUtils.cleanDatabase();
});

// Handle unhandled promise rejections in tests
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Export for use in tests
export { jest };
