import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

interface VercelConfig {
  headers?: { headers: { key: string; value: string }[] }[];
}

/** The production security headers (CSP and friends), reused so previews and tests match Vercel. */
const vercel = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8")) as VercelConfig;
const securityHeaders = Object.fromEntries(
  (vercel.headers?.[0]?.headers ?? []).map(({ key, value }) => [key, value]),
);
export default defineConfig({
    plugins: [react()],
  preview: { headers: securityHeaders },
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
