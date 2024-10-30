// jest.config.js
module.exports = {
    preset: 'ts-jest',                   // Use ts-jest preset for TypeScript
    testEnvironment: 'node',             // Use Node.js as the test environment
    testMatch: ['**/*.test.ts'], // Look for test files in __tests__ folder
    moduleFileExtensions: ['ts', 'js'],  // Recognize .ts and .js files
  };
  