/**
 * Fichier de configuration unique du style visuel de l'application.
 *
 * Il centralise la palette, les polices et la description du style
 * d'illustration. Objectif : garder une cohérence visuelle entre les pages
 * de l'application, les PDF et (plus tard) les illustrations générées.
 */

export const STYLE_CONFIG = {
  /** Palette « Nuit féerique » (voile bleuté, bleu indigo, rose étincelle), reprise dans les PDF. */
  couleurs: {
    fond: "#EEF2FD",
    primaire: "#4F5FE0",
    secondaire: "#D4698C",
    accent: "#5B9BFF",
    texte: "#1B2250",
    texteClair: "#5B6598",
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
export type IllustrationStyle =
  | "feerique"
  | "aventure"
  | "manga"
  | "bd"
  | "aquarelle"
  | "papier"
  | "pastel";

/**
 * Catalogue des styles proposés au parent. L'ordre d'affichage est celui-ci :
 * « Féerique » en premier (style par défaut et signature de la marque).
 * Aucun style ne repose sur une lumière « golden-hour » jaune/orangée : la
 * palette reste fraîche et féerique, cohérente avec l'identité du produit.
 */
export const ILLUSTRATION_STYLES: Record<
  IllustrationStyle,
  { label: string; description: string; prompt: string }
> = {
  feerique: {
    label: "Féerique",
    description: "Lavande, étoiles, douceur du soir",
    prompt:
      "dreamy fairytale storybook illustration in a SOFT COOL PASTEL palette: " +
      "lavender, periwinkle blue, soft rose pink, mint green and moonlit silver, " +
      "with only tiny delicate silver sparkle accents; AVOID yellow, orange, amber or golden-hour lighting; " +
      "cool magical twilight glow, floating stardust, delicate linework, gentle bokeh, " +
      "tender ethereal bedtime atmosphere, painterly soft edges",
  },
  aventure: {
    label: "Aventure",
    description: "Grands espaces, couleurs vives et fraîches",
    prompt:
      "luminous children's adventure picture book illustration, lush gouache textures, " +
      "clear bright DAYLIGHT (soft blue sky, NO golden-hour, NO amber, NO yellow cast), " +
      "rich cool-leaning palette of emerald green, teal, sky blue, periwinkle and coral pink, " +
      "friendly rounded character design, lively outdoor exploration, crisp sense of wonder, gentle depth of field",
  },
  manga: {
    label: "Manga",
    description: "Traits nets, grands yeux expressifs",
    prompt:
      "charming kawaii anime illustration for young children, clean confident linework, smooth soft cel shading, " +
      "big expressive sparkling eyes, gentle rosy blush, bright yet soft cool palette, " +
      "wholesome cosy Studio-Ghibli-like gentleness, airy skies",
  },
  bd: {
    label: "BD / Super-héros",
    description: "Comic dynamique, cases et éclats",
    prompt:
      "dynamic comic book / bande dessinée illustration for kids, bold black ink outlines, " +
      "halftone dot shading, vivid saturated primary colors, action lines and speed lines, " +
      "heroic superhero comic energy with pop-art 'POW' flair, but wholesome and child-friendly, " +
      "clean cel coloring, dramatic but joyful",
  },
  aquarelle: {
    label: "Aquarelle",
    description: "Lavis délicats, poésie et transparence",
    prompt:
      "delicate watercolor children's picture book illustration, soft wet-on-wet washes with gentle blooms, " +
      "visible cold-press paper grain, airy negative space, tender pastel palette of lilac, blush, sky blue and sage, " +
      "loose expressive brushwork, poetic and luminous, soft feathered edges, no harsh outlines",
  },
  papier: {
    label: "Papier découpé",
    description: "Collage de papiers en relief",
    prompt:
      "layered cut-paper collage (papercraft) children's book illustration, flat matte paper shapes " +
      "with soft realistic drop shadows between the layers for depth, subtle paper texture and torn edges, " +
      "bold friendly geometric composition, cheerful cool palette of violet, teal, rose and cream-white, tactile handcrafted feel",
  },
  pastel: {
    label: "Pastel",
    description: "Crayon doux, velouté et câlin",
    prompt:
      "soft pastel and colored-pencil children's book illustration, velvety chalky texture, " +
      "gentle grainy strokes, rounded cuddly character design, warm-hearted but COOL pastel palette " +
      "of mauve, periwinkle, mint and dusty pink (no yellow, no orange), cosy dreamy bedtime mood, soft diffuse light",
  },
};

/**
 * Clés du catalogue sous forme de tuple non vide (pour `z.enum`). Source unique :
 * ajouter un style ci-dessus le rend automatiquement valide partout (formulaire,
 * validation serveur, schéma d'histoire).
 */
export const ILLUSTRATION_STYLE_KEYS = Object.keys(ILLUSTRATION_STYLES) as [
  IllustrationStyle,
  ...IllustrationStyle[],
];

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

