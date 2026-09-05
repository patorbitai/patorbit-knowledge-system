import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    // Use worker threads instead of child processes. The default "forks" pool
    // spawns one process per test file, which is slow on Windows and can hit
    // vitest's worker-startup timeout ("[vitest-pool-runner]: Timeout waiting
    // for worker to respond") when many files start at once.
    pool: "threads",
    // Global setup: enforces production database safety before any test runs.
    // If TEST_DATABASE_URL is missing or points to production, tests ABORT.
    setupFiles: ["./src/test-setup.ts"],
    exclude: ["node_modules/**", "e2e/**", "**/dist/**"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
