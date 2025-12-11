export default {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server.js',
    '!node_modules/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
};