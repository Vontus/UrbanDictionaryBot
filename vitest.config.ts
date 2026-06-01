import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      BOT_TOKEN: "test-token",
    },
  },
});
