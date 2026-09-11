import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    fileParallelism: false,
    sequence: { concurrent: false },
    hookTimeout: 60_000,
    testTimeout: 60_000,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'test',
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://velure:velure_dev@localhost:5432/velure?schema=public',
      JWT_ACCESS_SECRET:
        process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-minimum-32-characters-long',
      JWT_REFRESH_SECRET:
        process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-minimum-32-characters-long',
    },
  },
});
