import type { Config } from "tailwindcss";

// Thème « Nuit féerique » : bleu nuit étoilé, pervenche lumineuse, étincelles
// violet → rose. Palette FROIDE et féerique (aucun jaune / doré), à dominante
// BLEUE. Les noms de tokens sont conservés (parch, or, magique…) : on ne change
// que leurs valeurs pour faire basculer tout le site d'un coup.
// Les polices (Fraunces/Nunito) sont fournies via next/font (variables CSS).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bleu nuit profond (sections sombres : pied de page, appel du soir…).
        nuit: { DEFAULT: "#0f1a44", 2: "#16245c", doux: "#33407f" },
        // Ancien « parchemin » → voile bleuté glacé (surfaces claires).
        parch: { DEFAULT: "#eef2fd", 2: "#e0e8fb" },
        // Ancien « or » → étincelle rose féerique (accent chaud sur le bleu).
        or: { DEFAULT: "#e07cc0", clair: "#f6b8e0", fonce: "#a93e82" },
        // On conserve l'échelle « magique » (déjà utilisée partout) en la
        // ré-accordant à la palette « Nuit féerique » bleue.
        magique: {
          fond: "#eef2fd", // voile bleuté (fond de page)
          primaire: "#4f5fe0", // bleu féerique (indigo lumineux, couleur de marque)
          secondaire: "#d4698c", // rose féerique (étincelle)
          accent: "#5b9bff", // bleu pervenche clair (lueur céleste)
          rose: "#d4698c",
          texte: "#1b2250", // encre bleu nuit
          texteClair: "#5b6598",
          trait: "#dbe2f6",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        // Alias historique utilisé dans le code : pointe désormais sur Nunito.
        conte: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        conte: "0 30px 60px -32px rgba(15,26,68,.45)",
        or: "0 10px 26px rgba(79,95,224,.42)",
      },
    },
  },
  plugins: [],
};

export default config;
