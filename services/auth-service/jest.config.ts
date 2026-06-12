import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
  },
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  globalSetup: './tests/globalSetup.ts',
  globalTeardown: './tests/globalTeardown.ts',
  setupFilesAfterEnv: ['./tests/setup.ts'],
  verbose: true,
  clearMocks: true,
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/config/**/*.ts',
  ],
  coverageDirectory: 'coverage',

  // Whenever test code (or code it imports) does `import Redis from 'ioredis'`,
  // Jest substitutes it with 'ioredis-mock' instead — a fake in-memory Redis
  moduleNameMapper: {
    '^ioredis$': 'ioredis-mock',
  },

  maxWorkers:1,
};

export default config;