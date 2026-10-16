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

/**
 * Styles d'illustration proposés au parent. Chaque style est un fragment de
 * prompt (en anglais, pour une meilleure obéissance des modèles d'image) ajouté
 * devant la description de la scène. On garde un seul endroit pour les définir.
 */
export type IllustrationStyle = "aventure" | "feerique" | "manga";

export const ILLUSTRATION_STYLES: Record<
  IllustrationStyle,
  { label: string; description: string; prompt: string }
> = {
  aventure: {
    label: "Aventure",
    description: "Couleurs vives, grands espaces",
    prompt:
      "children's picture book illustration, warm vibrant colors, soft watercolor and gouache, " +
      "adventurous outdoor scenes, friendly rounded shapes, storybook art",
  },
  feerique: {
    label: "Féerique",
    description: "Pastel, étoiles, douceur",
    prompt:
      "dreamy fairytale storybook illustration, soft pastel palette, glowing magical light, " +
      "sparkles and stars, gentle whimsical atmosphere, tender and soft",
  },
  manga: {
    label: "Manga",
    description: "Traits marqués, grands yeux",
    prompt:
      "cute kawaii anime manga illustration for young children, clean bold linework, soft cel shading, " +
      "expressive friendly big eyes, wholesome and gentle",
  },
};

/** Socle commun à tous les prompts d'image : sécurité et qualité enfant. */
export const BASE_IMAGE_PROMPT =
  "no text, no letters, no watermark, child-friendly, wholesome, cute, " +
  "no scary elements, no violence, soft lighting, high quality, centered composition";

/**
 * Construit le prompt d'image final à partir du style, de la scène et, si
 * disponibles, du nom du héros et d'une description d'apparence (jamais la photo
 * elle-même). Résultat en anglais pour une meilleure qualité de rendu.
 */
export function buildIllustrationPrompt(opts: {
  style: IllustrationStyle;
  scene: string;
  heroName?: string;
  appearance?: string;
}): string {
  const parts = [ILLUSTRATION_STYLES[opts.style].prompt];
  if (opts.heroName) parts.push(`main character named ${opts.heroName}`);
  if (opts.appearance && opts.appearance.trim().length > 0) {
    parts.push(`character appearance: ${opts.appearance.trim()}`);
  }
  parts.push(`scene: ${opts.scene}`);
  parts.push(BASE_IMAGE_PROMPT);
  return parts.join(". ");
}

