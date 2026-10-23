/**
 * Fichier de configuration unique du style visuel de l'application.
 *
 * Il centralise la palette, les polices et la description du style
 * d'illustration. Objectif : garder une cohérence visuelle entre les pages
 * de l'application, les PDF et (plus tard) les illustrations générées.
 */

export const STYLE_CONFIG = {
  /** Palette « conte enchanté » (parchemin, plume, or), reprise dans les PDF. */
  couleurs: {
    fond: "#FBF2DF",
    primaire: "#6D3BD1",
    secondaire: "#E9A94B",
    accent: "#39A58F",
    texte: "#2A2443",
    texteClair: "#6F6690",
  },

  /** Polices lisibles pour les enfants. */
  polices: {
    corps: "Nunito, system-ui, sans-serif",
    titre: "Fraunces, Georgia, serif",
  },

  /** Rendu des illustrations : paysage pour les pages, carré pour la couverture. */
  illustration: {
    styleDescription:
      "Illustration de livre pour enfants, douce et chaleureuse, " +
      "cohérente d'une page à l'autre, sans texte, ambiance bienveillante.",
    ratioPage: "16:10",
    ratioCouverture: "1:1",
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
      "warm vibrant children's picture book illustration, lush gouache and watercolor textures, " +
      "golden-hour cinematic lighting, rich saturated palette of emerald green, sky blue and warm amber, " +
      "friendly rounded character design, lively outdoor adventure, sense of wonder, gentle depth of field",
  },
  feerique: {
    label: "Féerique",
    description: "Pastel, étoiles, douceur",
    prompt:
      "dreamy fairytale storybook illustration in a SOFT COOL PASTEL palette: " +
      "lavender, periwinkle blue, soft rose pink, mint green and moonlit silver, " +
      "with only tiny delicate gold sparkle accents; AVOID heavy yellow, orange or golden-hour lighting; " +
      "cool magical twilight glow, floating stardust, delicate linework, gentle bokeh, " +
      "tender ethereal bedtime atmosphere, painterly soft edges",
  },
  manga: {
    label: "Manga",
    description: "Traits marqués, grands yeux",
    prompt:
      "charming kawaii anime illustration for young children, clean confident linework, smooth soft cel shading, " +
      "big expressive sparkling eyes, gentle rosy blush, bright yet soft palette, " +
      "wholesome Studio-Ghibli-like warmth and cosiness",
  },
};

/**
 * Socle commun : médium, qualité et sécurité enfant. On énonce clairement ce
 * qu'il faut EXCLURE (texte, filigrane, contenu inadapté) car les modèles le
 * suivent mieux ainsi.
 */
export const BASE_IMAGE_PROMPT =
  "professional children's book illustration, highly detailed, beautiful and polished, " +
  "balanced storybook composition; " +
  "KEEP THE EXACT SAME art style, rendering technique and color palette as the other pages of this same book, " +
  "so every page looks like one consistent illustrated album; " +
  "absolutely no text, no letters, no words, no numbers, no watermark, no logo, no signature; " +
  "wholesome and child-safe, no scary, no violent, no sad or dark elements";

/**
 * Style « cahier de coloriage » : dessin au trait noir et blanc, à imprimer.
 */
export const COLORING_PROMPT =
  "black and white coloring book page for young children, bold clean black outlines only, " +
  "thick even line weight, no shading, no gray, no color, pure white background, " +
  "large simple shapes easy to color, cute and friendly; " +
  "absolutely no text, no letters, no watermark, no signature";

/**
 * Construit une « fiche personnage » réutilisée à l'identique sur chaque page
 * pour garder le héros cohérent d'une illustration à l'autre. Jamais de photo :
 * seulement un nom et une description d'apparence.
 */
export function buildCharacterSheet(heroName?: string, appearance?: string): string {
  const name = heroName?.trim();
  const look = appearance?.trim();
  if (!name && !look) return "";
  const who = name ? `the main character ${name}` : "the main character";
  const desc = look ? ` (${look})` : "";
  return `${who}${desc}, same consistent character design and outfit in every image, appealing and expressive`;
}

/**
 * Construit le prompt d'image final : style → personnage cohérent → scène →
 * cadrage → socle qualité/sécurité. Résultat en anglais pour un meilleur rendu.
 */
export function buildIllustrationPrompt(opts: {
  style: IllustrationStyle;
  scene: string;
  heroName?: string;
  appearance?: string;
  /** true : version dessin au trait pour le cahier de coloriage. */
  coloring?: boolean;
}): string {
  const parts: string[] = [
    opts.coloring ? COLORING_PROMPT : ILLUSTRATION_STYLES[opts.style].prompt,
  ];

  const personnage = buildCharacterSheet(opts.heroName, opts.appearance);
  if (personnage) parts.push(personnage);

  parts.push(`Scene: ${opts.scene}`);

  if (opts.coloring) {
    parts.push("full scene with clear outlines, no text, no watermark");
  } else {
    parts.push("clear focal subject, inviting and immersive");
    parts.push(BASE_IMAGE_PROMPT);
  }

  return parts.filter(Boolean).join(". ");
}

