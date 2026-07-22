import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    setupFiles: [], // No global setup needed
  },
  resolve: {
    alias: {
      '@': 'src',
      '@platform': 'src/platform',
      '@patorbit/database': 'packages/database',
      '@patorbit/config': 'packages/config',
      '@patorbit/auth': 'packages/auth/src',
    },
  },
});
