module.exports = {
  testEnvironment: "node",
  // Keep Jest focused on unit/integration tests only; Playwright specs run via `npm test`
  testMatch: ["**/__tests__/**/*.test.js"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/",
    "/test-results/",
    "/playwright-report/",
  ],
  collectCoverageFrom: [
    "utils/**/*.js",
    "controllers/**/*.js",
    "!node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  verbose: true,
  testTimeout: 10000,
};
