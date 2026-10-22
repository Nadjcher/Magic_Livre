import type { Config } from "tailwindcss";

// Thème « conte enchanté » : nuit améthyste, parchemin chaud et or.
// Les polices (Fraunces/Nunito) sont fournies via next/font (variables CSS).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nuit: { DEFAULT: "#141131", 2: "#1b1544", doux: "#38316f" },
        parch: { DEFAULT: "#fbf2df", 2: "#f4e7cc" },
        or: { DEFAULT: "#e07cc0", clair: "#f6b8e0", fonce: "#a93e82" },
        // On conserve l'échelle « magique » (déjà utilisée partout) en la
        // ré-accordant à la nouvelle palette féerique.
        magique: {
          fond: "#fbf2df",
          primaire: "#6d3bd1", // plume (violet profond)
          secondaire: "#e9a94b", // or
          accent: "#39a58f", // teal
          rose: "#d4698c",
          texte: "#2a2443",
          texteClair: "#6f6690",
          trait: "#e6dcc4",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        // Alias historique utilisé dans le code : pointe désormais sur Nunito.
        conte: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        conte: "0 30px 60px -32px rgba(20,17,49,.45)",
        or: "0 10px 26px rgba(141,75,208,.42)",
      },
    },
  },
  plugins: [],
};

export default config;
