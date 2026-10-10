import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 120_000,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3000", launchOptions: { executablePath: process.env.REMOTION_BROWSER ?? "/usr/bin/chromium", args: ["--no-sandbox"] } },
});
