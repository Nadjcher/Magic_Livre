import type { Config } from "tailwindcss";

// Configuration Tailwind. Les couleurs reprennent la palette douce
// définie dans src/lib/style_config.ts pour garder une cohérence visuelle.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        magique: {
          fond: "#FFF9F0",
          primaire: "#7C3AED",
          secondaire: "#F59E0B",
          accent: "#10B981",
          texte: "#1F2937",
        },
      },
      fontFamily: {
        conte: ["Comic Sans MS", "Chalkboard SE", "Comic Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
