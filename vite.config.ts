import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
        include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "shared/**/*.ts", "server/**/*.ts", "api/**/*.ts"],
      exclude: ["src/main.tsx", "**/*.d.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { statements: 75, lines: 75, functions: 70, branches: 65 },
    },
  },
});
