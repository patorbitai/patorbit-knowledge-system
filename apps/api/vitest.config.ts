import path from 'path';
import { defineConfig } from 'vitest/config';

const root = path.resolve(__dirname, '../..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@platform': path.resolve(__dirname, 'src/platform'),
      '@patorbit/database': path.resolve(root, 'packages/database/src'),
      '@patorbit/config': path.resolve(root, 'packages/config/src'),
      '@patorbit/auth': path.resolve(root, 'packages/auth/src'),
      '@patorbit/storage': path.resolve(root, 'packages/storage/src'),
    },
  },
});
