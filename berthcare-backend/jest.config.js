/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.property.ts',
  ],
  roots: ['<rootDir>/src'],
  clearMocks: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^../lib/config.js$': '<rootDir>/src/lib/config.ts',
    '^../observability/transport/datadog.js$': '<rootDir>/src/observability/transport/datadog.ts',
    '^../observability/transport/cloudwatch.js$': '<rootDir>/src/observability/transport/cloudwatch.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!jose)'],
};
