import { defineConfig } from "vitest/config";
import path from "node:path";

// Configuration Vitest pour les tests unitaires de la logique métier
// (filtres, personnages protégés, validation, PDF, génération).
export default defineConfig({
  // Utilise le runtime JSX automatique (comme Next.js) pour les fichiers .tsx.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // « server-only » refuse d'être importé hors contexte serveur : on le
      // remplace par un module vide pour les tests unitaires.
      "server-only": path.resolve(__dirname, "./tests/stubs/empty.ts"),
    },
  },
});
