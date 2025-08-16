module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.js'],
  verbose: true,
  forceExit: true, // Exit Jest after all tests are run
  clearMocks: true, // Clear mock calls and instances between tests
};