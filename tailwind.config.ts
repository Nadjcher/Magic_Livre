import type { Config } from "tailwindcss";

// Thème « Nuit enchantée » : moonlit lavande, nuit améthyste, étincelle violet → rose.
// Palette FROIDE et féerique (aucun jaune / doré). Les noms de tokens sont
// conservés (parch, or, magique…) : on ne change que leurs valeurs pour faire
// basculer tout le site d'un coup, sans toucher chaque composant.
// Les polices (Fraunces/Nunito) sont fournies via next/font (variables CSS).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nuit: { DEFAULT: "#141131", 2: "#1b1544", doux: "#38316f" },
        // Ancien « parchemin » crème → voile lunaire lavande (surfaces claires).
        parch: { DEFAULT: "#f5f3fc", 2: "#ebe7f9" },
        // Ancien « or » → étincelle rose féerique (accent de marque).
        or: { DEFAULT: "#e07cc0", clair: "#f6b8e0", fonce: "#a93e82" },
        // On conserve l'échelle « magique » (déjà utilisée partout) en la
        // ré-accordant à la palette froide « Nuit enchantée ».
        magique: {
          fond: "#f5f3fc", // voile lunaire (fond de page)
          primaire: "#6d3bd1", // plume (violet profond)
          secondaire: "#d4698c", // rose féerique (remplace l'or)
          accent: "#6f8bff", // bleu pervenche (lueur froide)
          rose: "#d4698c",
          texte: "#241c42",
          texteClair: "#6a6291",
          trait: "#e3ddf3",
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
