import type { Config } from "tailwindcss";

// Thème « Nuit féerique » : tout le site sur un BLEU NUIT LUMINEUX étoilé,
// textes clairs, cartes en verre bleuté, étincelles pervenche → rose. Palette
// FROIDE et féerique (aucun jaune / doré). Les noms de tokens sont conservés (parch, or, magique…) : on ne change
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
        parch: { DEFAULT: "#25347c", 2: "#2e3f92" },
        // Ancien « or » → étincelle rose féerique (accent chaud sur le bleu).
        or: { DEFAULT: "#ff9fd6", clair: "#ffc8ea", fonce: "#ffb4e1" },
        // On conserve l'échelle « magique » (déjà utilisée partout) en la
        // ré-accordant à la palette « Nuit féerique » bleue.
        magique: {
          fond: "#1e2c74", // bleu nuit lumineux (fond de page)
          primaire: "#a3afff", // bleu féerique (pervenche lumineuse, couleur de marque ; contraste AA en texte sur le fond)
          secondaire: "#ff8fc4", // rose féerique (étincelle)
          accent: "#8fbcff", // bleu pervenche clair (lueur céleste)
          rose: "#ff8fc4",
          texte: "#eef2ff", // texte clair sur bleu nuit
          texteClair: "#b9c4ee",
          trait: "#3f4fa3",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        // Alias historique utilisé dans le code : pointe désormais sur Nunito.
        conte: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        conte: "0 30px 60px -28px rgba(5,10,40,.75)",
        // Ombre neutre (plus de halo coloré : signature typique des pages « faites par IA »).
        or: "0 12px 26px -12px rgba(5,10,40,.7)",
      },
    },
  },
  plugins: [],
};

export default config;
