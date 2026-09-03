import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Pure unit tests only — no DB, no network, so CI needs no services.
    include: ["src/**/*.test.ts"],
    environment: "node",
    /**
     * AppConfig fails fast on missing secrets, so tests supply their own
     * throwaway values. This also keeps the suite independent of whatever
     * happens to be in a developer's .env — and lets it run in CI with none.
     */
    env: {
      JWT_SECRET: "test-jwt-secret",
      JWT_REFRESH_SECRET: "test-jwt-refresh-secret",
      MONGODB_URL: "mongodb://localhost:27017/",
      DB_NAME: "yatriko-test",
    },
  },
})
