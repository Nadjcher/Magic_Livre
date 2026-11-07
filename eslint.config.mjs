import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      // Nouvelles règles du compilateur React 19 : signalées, sans bloquer
      // (motifs volontaires : lecture de window/localStorage au montage,
      // fermeture du menu après navigation, date côté serveur).
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  { ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"] },
];

export default config;
