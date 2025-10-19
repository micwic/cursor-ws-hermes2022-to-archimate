// Configuration Jest-Cucumber partagée
module.exports = {
    testMatch: [
      '**/__tests__/integration/**/*.steps.{js,ts}',
      '**/__tests__/e2e/**/*.steps.{js,ts}'
    ],
    transform: {
      '^.+\\.ts$': ['ts-jest', { tsconfig: { esModuleInterop: true } }],
      '^.+\\.js$': 'babel-jest'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    testEnvironment: 'node',
    setupFilesAfterEnv: [
      '<rootDir>/__tests__/support/jest-cucumber-setup.js'
    ],
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/__tests__/support/'
    ],
    // Spécifique Jest-Cucumber
  };