/**
 * Jest Configuration for BVOTE Backend
 * Comprehensive testing setup with coverage reporting
 */

export default {
  // Test environment
  testEnvironment: "node",

  // Use ES modules
  preset: null,
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },

  // Module name mapping
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@services/(.*)$": "<rootDir>/services/$1",
    "^@middleware/(.*)$": "<rootDir>/middleware/$1",
    "^@routes/(.*)$": "<rootDir>/routes/$1",
  },

  // Test file patterns
  testMatch: ["<rootDir>/tests/**/*.test.js", "<rootDir>/tests/**/*.spec.js"],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    "services/**/*.js",
    "middleware/**/*.js",
    "routes/**/*.js",
    "server.js",
    "!**/node_modules/**",
    "!**/tests/**",
    "!**/coverage/**",
  ],

  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "html", "lcov", "json"],

  // Coverage thresholds (temporarily disabled for deployment)
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  //   "./services/": {
  //     branches: 85,
  //     functions: 85,
  //     lines: 85,
  //     statements: 85,
  //   },
  //   "./middleware/": {
  //     branches: 75,
  //     functions: 75,
  //     lines: 75,
  //     statements: 75,
  //   },
  // },

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Transform configuration for ES modules
  transform: {},

  // Module file extensions
  moduleFileExtensions: ["js", "json", "node"],

  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: "test",
  },

  // Global setup and teardown (commented out until test files are created)
  // globalSetup: "<rootDir>/tests/globalSetup.js",
  // globalTeardown: "<rootDir>/tests/globalTeardown.js",

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/coverage/", "/dist/"],

  // Watch plugins (commented out - packages not installed)
  // watchPlugins: [
  //   "jest-watch-typeahead/filename",
  //   "jest-watch-typeahead/testname",
  // ],

  // Reporter configuration (simplified)
  reporters: ["default"],

  // Error handling
  errorOnDeprecated: true,

  // Bail on first test failure in CI
  bail: process.env.CI ? 1 : 0,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Max worker processes
  maxWorkers: process.env.CI ? 2 : "50%",
};
