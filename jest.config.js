/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/**/*.test.ts',
    '!src/types/**',
    '!src/test-utils/**',
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
  setupFiles: ['<rootDir>/jest.setup.ts'],
};
