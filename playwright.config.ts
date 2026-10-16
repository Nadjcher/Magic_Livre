import { defineConfig, devices } from "@playwright/test";

// Configuration Playwright pour le test de bout en bout du parcours complet
// (création, lecture, paiement en mode test Stripe).
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.AUTH_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Démarre l'application en local pour les tests (réutilise un serveur existant).
  webServer: {
    command: "npm run dev",
    url: process.env.AUTH_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
