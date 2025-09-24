module.exports = {
  // Test environment
  testEnvironment: "node",

  // Module type - ESM support
  preset: null,

  // Transform files for ESM
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: { node: "current" },
              modules: "auto",
            },
          ],
        ],
      },
    ],
  },

  // Module file extensions
  moduleFileExtensions: ["js", "json"],

  // Test match patterns - only our __tests__ folder
  testMatch: ["**/__tests__/**/*.test.js"],

  // Ignore patterns
  testPathIgnorePatterns: [
    "/node_modules/",
    "/admin/",
    "/user/",
    "/backend/",
    "/__tests__/jest.config.js",
    "/__tests__/setup.js",
    "/admin/src/tests/",
    "/user/src/tests/",
    "*.test.jsx",
    "*.test.ts",
    "*.test.tsx",
  ],

  // Coverage settings - disabled for initial run
  collectCoverage: false,

  // Test timeout
  testTimeout: 30000,

  // Module paths
  moduleDirectories: ["node_modules", "<rootDir>"],

  // Clear mocks
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Error handling
  bail: false,
  forceExit: true,
  detectOpenHandles: false,

  // Module name mapper for absolute imports
  moduleNameMapper: {
    "^../libs/(.*)$": "<rootDir>/libs/$1",
  },

  // ESM support
  extensionsToTreatAsEsm: [".js"],
};
