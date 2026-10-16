/**
 * Fichier de configuration unique du style visuel de l'application.
 *
 * Il centralise la palette, les polices et la description du style
 * d'illustration. Objectif : garder une cohérence visuelle entre les pages
 * de l'application, les PDF et (plus tard) les illustrations générées.
 */

export const STYLE_CONFIG = {
  /** Palette de couleurs douce et chaleureuse, adaptée aux jeunes enfants. */
  couleurs: {
    fond: "#FFF9F0",
    primaire: "#7C3AED",
    secondaire: "#F59E0B",
    accent: "#10B981",
    texte: "#1F2937",
    texteClair: "#6B7280",
  },

  /** Polices lisibles pour les enfants. */
  polices: {
    corps: "Comic Sans MS, Chalkboard SE, Comic Neue, sans-serif",
    titre: "Comic Sans MS, Chalkboard SE, Comic Neue, sans-serif",
  },

  /**
   * Description du style d'illustration unique, utilisée par le fournisseur
   * d'images lorsqu'il sera activé. Centralisé ici pour garantir la cohérence.
   */
  illustration: {
    styleDescription:
      "Illustration douce de livre pour enfants, aquarelle numérique, " +
      "couleurs chaleureuses et pastel, formes rondes et rassurantes, " +
      "sans texte, ambiance bienveillante.",
    ratio: "16:9",
  },
} as const;

export type StyleConfig = typeof STYLE_CONFIG;
