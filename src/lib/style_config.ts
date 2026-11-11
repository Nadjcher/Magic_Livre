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
import {
  CONSIGNE_STYLE,
  DESSIN_ENFANT,
  INTERDITS_IMAGE,
  PERSONNAGES_FIXES,
  ZONE_TEXTE,
  consigneHeros,
} from "./bibleVisuelle";

export type IllustrationStyle =
  | "maison"
  | "feerique"
  | "aventure"
  | "manga"
  | "bd"
  | "aquarelle"
  | "papier"
  | "pastel"
  | "realiste"
  | "anim3d"
  | "crayon"
  | "classique"
  | "pixel";

/**
 * Catalogue des styles proposés au parent. L'ordre d'affichage est celui-ci :
 * « Féerique » en premier (style par défaut et signature de la marque).
 * Aucun style ne repose sur une lumière « golden-hour » jaune/orangée : la
 * palette reste fraîche et féerique, cohérente avec l'identité du produit.
 */
export const ILLUSTRATION_STYLES: Record<
  IllustrationStyle,
  {
    label: string;
    description: string;
    prompt: string;
    /** Âge minimum conseillé (manga, BD, réaliste… ne conviennent pas aux tout-petits). */
    ageMin: number;
  }
> = {
  // Le style de la maison (choisi le 11 novembre) : par défaut, et imposé pour
  // « Les contes de papa et maman ». La bible visuelle le précisera.
  maison: {
    label: "L'album d'Encore une histoire",
    ageMin: 1,
    description: "Peint, chaud et doux, comme un album classique",
    prompt:
      "classic French children's picture book illustration, hand-painted in warm watercolor and gouache, " +
      "soft painterly textures with visible paper grain and gentle brush strokes, NO ink outlines, NO flat cartoon shading, " +
      "warm palette of moss green, warm brown, deep night blue and golden light, a single clear light source per image, " +
      "soft glowing light on faces, cosy and tender atmosphere, rich detailed natural settings, " +
      "characters with natural proportions and natural-sized expressive eyes, never 3D, never anime",
  },
  feerique: {
    label: "Féerique",
    ageMin: 1,
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
    ageMin: 3,
    description: "Grands espaces, couleurs vives et fraîches",
    prompt:
      "luminous children's adventure picture book illustration, lush gouache textures, " +
      "clear bright DAYLIGHT (soft blue sky, NO golden-hour, NO amber, NO yellow cast), " +
      "rich cool-leaning palette of emerald green, teal, sky blue, periwinkle and coral pink, " +
      "friendly rounded character design, lively outdoor exploration, crisp sense of wonder, gentle depth of field",
  },
  manga: {
    label: "Manga / Animé",
    ageMin: 6,
    description: "Style dessin animé japonais, grands yeux",
    prompt:
      "IMPORTANT — Japanese anime / manga art style: large glossy anime eyes with bright highlights, thin clean " +
      "lineart, flat cel shading with crisp shadow shapes, anime character proportions and hair rendered in " +
      "clumps, soft pastel anime backgrounds, wholesome children's anime TV series look, NOT a western cartoon",
  },
  bd: {
    label: "BD / Super-héros",
    ageMin: 5,
    description: "Comic dynamique, cases et éclats",
    prompt:
      "dynamic comic book / bande dessinée illustration for kids, bold black ink outlines, " +
      "halftone dot shading, vivid saturated primary colors, action lines and speed lines, " +
      "heroic superhero comic energy with pop-art 'POW' flair, but wholesome and child-friendly, " +
      "clean cel coloring, dramatic but joyful",
  },
  aquarelle: {
    label: "Aquarelle",
    ageMin: 1,
    description: "Lavis délicats, poésie et transparence",
    prompt:
      "delicate watercolor children's picture book illustration, soft wet-on-wet washes with gentle blooms, " +
      "visible cold-press paper grain, airy negative space, tender pastel palette of lilac, blush, sky blue and sage, " +
      "loose expressive brushwork, poetic and luminous, soft feathered edges, no harsh outlines",
  },
  papier: {
    label: "Papier découpé",
    ageMin: 1,
    description: "Collage de papiers en relief",
    prompt:
      "layered cut-paper collage (papercraft) children's book illustration, flat matte paper shapes " +
      "with soft realistic drop shadows between the layers for depth, subtle paper texture and torn edges, " +
      "bold friendly geometric composition, cheerful cool palette of violet, teal, rose and cream-white, tactile handcrafted feel",
  },
  pastel: {
    label: "Pastel",
    ageMin: 1,
    description: "Crayon doux, velouté et câlin",
    prompt:
      "soft pastel and colored-pencil children's book illustration, velvety chalky texture, " +
      "gentle grainy strokes, rounded cuddly character design, warm-hearted but COOL pastel palette " +
      "of mauve, periwinkle, mint and dusty pink (no yellow, no orange), cosy dreamy bedtime mood, soft diffuse light",
  },
  realiste: {
    label: "Réaliste",
    ageMin: 6,
    description: "Peinture détaillée, proche du vrai",
    prompt:
      "semi-realistic digital painting for a children's book, natural human proportions, detailed realistic faces " +
      "and textures, soft cinematic lighting, rich believable environments, painterly brushwork, gentle and " +
      "heartwarming mood (child-friendly, never scary)",
  },
  anim3d: {
    label: "Animation 3D",
    ageMin: 2,
    description: "Comme un film d'animation en 3D",
    prompt:
      "IMPORTANT — this must look like a rendered 3D CGI frame from a modern animated family movie, NOT a 2D " +
      "drawing or painting: volumetric 3D shapes, smooth slightly glossy clay-like surfaces, soft ray-traced " +
      "global illumination, subsurface skin shading, rounded appealing characters with big expressive eyes, " +
      "shallow depth of field (original characters only)",
  },
  crayon: {
    label: "Crayon de couleur",
    ageMin: 1,
    description: "Dessin fait main, tout en douceur",
    prompt:
      "hand-drawn colored pencil illustration on textured paper, visible pencil strokes and hatching, warm-hearted " +
      "sketchbook charm, light airy colors, slightly naive childlike drawing quality, white paper showing through",
  },
  classique: {
    label: "Conte classique",
    ageMin: 2,
    description: "Album d'autrefois, charme vintage",
    prompt:
      "vintage mid-century children's storybook illustration, gouache and ink, limited harmonious palette, " +
      "subtle print grain, timeless classic fairy-tale charm, elegant simple shapes, nostalgic and tender",
  },
  pixel: {
    label: "Pixel art",
    ageMin: 6,
    description: "Façon jeu vidéo rétro",
    prompt:
      "IMPORTANT — the ENTIRE image must be PIXEL ART like a 16-bit retro console game: clearly visible square " +
      "pixels, low resolution grid, hard pixel edges, limited flat color palette with dithering, no smooth " +
      "gradients, no painterly brushwork, no realistic rendering; cute chunky sprites with readable faces",
  },
};

/**
 * Clés du catalogue sous forme de tuple non vide (pour `z.enum`). Source unique :
 * ajouter un style ci-dessus le rend automatiquement valide partout (formulaire,
 * validation serveur, schéma d'histoire).
 */
/** Styles adaptés à un âge. */
export function stylesPourAge(age: number): IllustrationStyle[] {
  return (Object.keys(ILLUSTRATION_STYLES) as IllustrationStyle[]).filter(
    (k) => age >= ILLUSTRATION_STYLES[k].ageMin,
  );
}

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
  "absolutely no text, no letters, no words, no numbers, no watermark, no logo, no brand marks on clothing, no signature; " +
  "ONLY the characters named in the scene appear — no extra people, no extra children, no random animals; " +
  "the hero appears only ONCE in the image (never duplicated); no speech bubbles, no captions; " +
  "secondary characters never look like the hero (different hair, face and clothes); " +
  "faces with natural-sized eyes true to the character sheet, never oversized round cartoon eyes; " +
  "no letters, no writing, no signs or symbols on objects (pebbles, books, walls); " +
  "full-bleed scenery to every edge; any calm area for text is a natural part of the scene (a night sky blending into the treetops, a soft wall), never a flat band, a frame or an empty box; " +
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
  const traits = look ? `, keep these exact physical traits on this page: ${look}` : "";
  return `${who}${desc}${traits}, same consistent character design and outfit in every image, appealing and expressive, ${name ?? "the hero"} appears only ONCE in the image (never duplicated)`;
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
  /** Fiche des personnages secondaires récurrents (en anglais). */
  recurringCharacters?: string;
  /** true : version dessin au trait pour le cahier de coloriage. */
  coloring?: boolean;
}): string {
  // Style de la maison : la « consigne type » de la bible visuelle.
  if (opts.style === "maison" && !opts.coloring) {
    return [
      CONSIGNE_STYLE,
      consigneHeros(opts.heroName, opts.appearance),
      opts.recurringCharacters?.trim()
        ? `CHARACTER SHEET (the hero always wears exactly this outfit; recurring characters drawn exactly as described, identical on every page): ${opts.recurringCharacters.trim()}`
        : "",
      PERSONNAGES_FIXES,
      `SCENE: ${opts.scene}`,
      ZONE_TEXTE,
      DESSIN_ENFANT,
      INTERDITS_IMAGE,
      "Each character appears only once.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  const parts: string[] = [
    opts.coloring ? COLORING_PROMPT : ILLUSTRATION_STYLES[opts.style].prompt,
  ];

  const personnage = buildCharacterSheet(opts.heroName, opts.appearance);
  if (personnage) parts.push(personnage);

  if (opts.recurringCharacters?.trim()) {
    parts.push(
      `Character sheet — the hero ALWAYS wears exactly the outfit described here, and recurring characters, ` +
        `if they appear, are drawn EXACTLY as described, identical on every page (same species, colors, size ` +
        `and features): ${opts.recurringCharacters.trim()}`,
    );
  }

  parts.push(`Scene: ${opts.scene}`);

  if (opts.coloring) {
    parts.push("full scene with clear outlines, no text, no watermark");
  } else {
    parts.push("clear focal subject, inviting and immersive");
    parts.push(BASE_IMAGE_PROMPT);
  }

  return parts.filter(Boolean).join(". ");
}

