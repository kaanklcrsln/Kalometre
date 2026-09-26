import { defineConfig } from "vitest/config";

// Firestore kural testleri: emülatör gerektirir (npm run test:rules).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
