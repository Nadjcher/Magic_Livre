/**
 * La bible visuelle d'Encore une histoire, COMMUNE à tous les styles (décor plein
 * cadre, une lumière principale, héros fidèle à son portrait, doudou
 * reconnaissable, Poucet à l'échelle, dessin de l'enfant distinct, interdits),
 * plus une fiche courte par style (technique, palette, interdits du style).
 * Donnée au générateur d'images (en anglais) et à la relectrice d'images.
 */

/** Le style de la maison (peint). */
export const STYLE_MAISON = "maison";
/** Le style 3D (celui de la page d'accueil et du catalogue). */
export const STYLE_3D = "anim3d";

/**
 * Tous les styles suivent la bible visuelle : pages carrées, consigne type,
 * relectrice à grille (depuis le 12 novembre ; les livres plus anciens sont en paysage).
 */
export function estCarre(style: string | undefined): boolean {
  return Boolean(style);
}

/**
 * La fiche d'un style : la seule chose qui change d'un style à l'autre
 * (technique, palette, ce qui est interdit dans ce style). Tout le reste de la
 * bible est commun.
 */
export interface FicheStyle {
  technique: string;
  palette: string;
  interdits: string;
  /** Les yeux tels que ce style les dessine (sinon : taille naturelle). */
  yeux?: string;
}

export const FICHES_STYLE: Record<string, FicheStyle> = {
  maison: {
    technique: "a children's picture-book page hand-painted in watercolor and gouache, soft textures, visible paper grain, shapes modelled by color and light",
    palette: "deep night blue, moss green, warm brown, warm golden light; white reserved for what the child draws",
    interdits: "ink outlines, 3D, anime, photographic rendering, flat cartoon shading",
  },
  anim3d: {
    technique: "a single frame from a premium modern 3D animated family film: volumetric characters AND sets, soft plush and polished materials, subsurface skin shading, soft key light with gentle rim light",
    palette: "deep night blue, warm wood and moss tones, warm golden light, one accent color tied to the child",
    interdits: "any 2D drawn, sketched or pencil background, mixed media, photo-realism",
    yeux: "expressive eyes in proportion (never huge exaggerated eyes)",
  },
  feerique: {
    technique: "a dreamy fairy-tale storybook illustration, painterly soft edges, delicate linework, floating stardust",
    palette: "soft cool pastels: lavender, periwinkle, rose pink, mint and moonlit silver",
    interdits: "yellow, orange or golden-hour light, harsh black outlines, 3D",
  },
  aventure: {
    technique: "a luminous adventure picture-book illustration in lush gouache, friendly rounded characters, open landscapes",
    palette: "clear daylight: emerald, teal, sky blue, periwinkle, coral",
    interdits: "golden-hour or amber cast, gloomy darkness, 3D",
  },
  manga: {
    technique: "a frame of a Japanese anime TV series for children: thin clean lineart, two-tone cel shading with crisp shadow shapes, anime faces (small nose, simple mouth), spiky glossy hair clumps with highlights, painted anime background; tiny characters stay truly tiny",
    palette: "bright clean anime colors over a soft painted background",
    interdits: "western cartoon or storybook look, 3D, watercolor or painterly characters",
    yeux: "large glossy anime eyes with big highlights",
  },
  bd: {
    technique: "French bande dessinée style for kids (one single full-bleed image, not a comic page): bold black ink outlines, clean cel coloring, light halftone dots, dynamic but gentle; tiny characters stay truly tiny",
    palette: "vivid saturated primary colors",
    interdits: "panel borders, white frame or margin, speech bubbles, onomatopoeia or any lettering, superhero logos, 3D",
  },
  aquarelle: {
    technique: "delicate watercolor: soft wet-on-wet washes with gentle blooms, loose expressive brushwork, cold-press paper grain; tiny characters stay truly tiny (toy-figurine size)",
    palette: "tender pastels: lilac, blush, sky blue, sage",
    interdits: "harsh outlines, 3D, flat digital colors, small characters drawn as big as the hero",
  },
  papier: {
    technique: "layered cut-paper collage: flat matte paper shapes with soft drop shadows between layers, torn edges, tactile handcrafted feel; tiny characters are cut truly tiny (toy-figurine size)",
    palette: "violet, teal, rose and cream-white",
    interdits: "painterly gradients, 3D renders, photographs, small characters as big as the hero",
  },
  pastel: {
    technique: "soft pastel and colored pencil: velvety chalky texture, gentle grainy strokes, rounded cuddly characters; tiny characters stay truly tiny (toy-figurine size)",
    palette: "cool pastels: mauve, periwinkle, mint, dusty pink",
    interdits: "yellow or orange light, hard outlines, 3D, small characters drawn as big as the hero",
  },
  realiste: {
    technique: "a semi-realistic digital painting for a children's book: natural proportions, detailed faces and textures, painterly brushwork",
    palette: "natural, gentle cinematic colors",
    interdits: "photographs, uncanny faces, anything scary",
  },
  crayon: {
    technique: "hand-drawn colored pencil on textured paper: visible strokes and hatching, light sketchbook charm, slightly naive drawing",
    palette: "light airy colors, paper showing through only inside the drawing",
    interdits: "3D, digital gradients, black ink outlines",
  },
  classique: {
    technique: "a vintage mid-century storybook illustration in gouache and ink, elegant simple shapes, subtle print grain, the scene running to all four edges of the image",
    palette: "a limited harmonious vintage palette",
    interdits: "3D, glossy digital rendering, neon colors, ANY frame, border, margin or rounded corners around the picture",
  },
  pixel: {
    technique: "PIXEL ART like a 16-bit retro console game: big simple shapes, flat color areas, strong contrast, cute chunky sprites with large readable faces (the image is pixelated afterwards, so keep details big and simple)",
    palette: "a limited flat retro palette with strong contrast",
    interdits: "fine details, thin lines, smooth gradients, painterly brushwork, realistic rendering",
    yeux: "simple readable pixel eyes",
  },
};

/** Bloc STYLE de la consigne type pour un style : sa fiche, puis les règles communes de cadrage et de lumière. */
export function consigneStylePour(style: string | undefined): string {
  const f = FICHES_STYLE[style ?? ""] ?? FICHES_STYLE.anim3d!;
  return (
    `STYLE (fixed): ${f.technique}. Palette: ${f.palette}. Never in this style: ${f.interdits}. ` +
    "ONE consistent rendering for the whole image (characters and scenery in the same technique). " +
    "Full-bleed scenery to every edge, square format, no empty area. " +
    "LIGHT: a single main light source, the one named in the scene; it lights the child's face first; small distant lights are allowed only if " +
    "they do not light the characters; the edges of the image are a little darker than the center. Night scenes stay LUMINOUS (moonlit blue, " +
    "never black): faces and hair bright and clearly readable, no large pure-black areas, so the page prints well."
  );
}

/** Bloc HÉROS : traits du portrait validé, répétés à chaque page. */
export function consigneHeros(nom: string | undefined, traits: string | undefined, style?: string): string {
  const yeux = FICHES_STYLE[style ?? ""]?.yeux ?? "natural-sized almond-shaped eyes (never big round cartoon eyes)";
  return (
    `HERO${nom ? ` (${nom})` : ""}: drawn from the approved portrait (reference image), never from a photo. ` +
    (traits ? `Exact traits: ${traits}. The hair keeps EXACTLY this color and cut on every page, whatever the light (never darker at night). ` : "") +
    `${yeux}; soft smile with the mouth barely open unless the scene asks for laughter; ` +
    "proportions of a child of that age (the head is a quarter to a fifth of the body)."
  );
}

/** Personnages fixes (fiches identiques dans tous les livres). */
export const PERSONNAGES_FIXES =
  "FIXED CHARACTERS: a secondary character never looks like the hero. " +
  "Little Thumb (Petit Poucet): clearly a little BOY (a boy's face, short straight black hair cut above the ears, no fringe over the eyes), red knitted bonnet, brown jacket, a cheerful face; ALWAYS the same tiny size on every page: " +
  "a toy-figurine-sized boy about 25 cm tall: his whole body fits between the ground and the child's knee, and even when the child crouches, " +
  "the top of his bonnet stays below the child's chest (never at waist or shoulder height); when he is next to the child he stands ON something " +
  "(a mushroom, a stone, a leaf) so his tiny size is obvious; trousers patched, never ripped. " +
  "The child's cuddly toy: exactly the plush described in the character sheet (its species, colour and shape clearly readable: ears, muzzle, paws), " +
  "soft and cute, never a shapeless blob, no seams or patches, held in the child's arms, never alive. " +
  "Tiny characters (Poucet, elves) keep their tiny size on EVERY page: never as big as the hero, never seated on full-size chairs. " +
  "The parent: an adult, clearly bigger than the child and never dressed like the child; only a hand, a silhouette from behind or a profile in shadow, never a detailed face. " +
  "The giant: never shown, only suggested by a shadow or boots.";

/** Objets fixes. */
export const OBJETS_FIXES =
  "THE WHITE PENCIL: a pure white pencil (white wood and white tip), never an ordinary yellow or wooden pencil. " +
  "PEBBLES drawn by the child: separate small crooked pebbles spaced apart, never a paved path, never stepping stones or flagstones.";

/** Le dessin de l'enfant : toujours distinct du décor peint. */
export const DESSIN_ENFANT =
  "WHAT THE CHILD DRAWS: irregular lumpy white shapes of unequal sizes, each outlined by a shaky white pencil line, " +
  "clearly different from the scenery; never a paved path, a road or regular pebbles. While it is only drawn: outline only, empty inside. Once it has become real: a full solid shape with a slight golden glow.";

/** Interdits. */
export const INTERDITS_IMAGE =
  "FORBIDDEN: letters, numbers or signs on objects, books or walls; hands with more or fewer than five fingers, extra limbs, distorted faces; " +
  "a secondary character resembling the hero; a living or scary cuddly toy; any known character, brand, existing superhero costume or detail from a film; " +
  "anything frightening (a monster in close-up, blood, a child alone in danger). The title is never drawn: no text at all.";

/** Zone de texte et couverture. */
export const ZONE_TEXTE =
  "QUIET AREA: keep about a quarter of the picture simple and quiet (open night sky, soft shadow or plain ground), painted with the same texture and colors as the rest of the scene, so text can be read over it.";

export const CONSIGNE_COUVERTURE =
  "COVER: a medium shot, the hero in three-quarter view facing the viewer, the top third calm (sky or soft shadow) for the title, which the website adds (never drawn).";

/**
 * La grille de la relectrice d'images, commune à tous les styles : une seule
 * question dépend du style (le rendu est-il bien celui de sa fiche ?).
 */
export function grillePour(style: string | undefined): string[] {
  const f = FICHES_STYLE[style ?? ""] ?? FICHES_STYLE.anim3d!;
  return [
    "HAIR: compare the hero's hair COLOR and cut with the reference image very carefully. If the color is noticeably different (e.g. honey-blond or reddish in the reference but dark brown or black on the page, or the reverse), answer no.",
    "FACE AND OUTFIT: the hero has the face, skin tone and distinctive features of the reference, and wears the outfit of the character sheet.",
    `The rendering is exactly this style, consistently over the whole image (characters and scenery alike): ${f.technique}. Nothing of: ${f.interdits}.`,
    "The picture is painted to every edge: if ANY part of the image is blank, white, unpainted or looks like an empty rectangle, answer no.",
    "There is a single MAIN light source, the one named in the scene, lighting the hero's face; small distant lights are fine as long as they do not light the characters.",
    "CUDDLY TOY: if the cuddly toy appears, it is the SAME species and color as its reference sheet (a teddy bear stays a teddy bear: if it looks like a dog, a cat, a fox or another animal, answer no), a plush toy, not alive.",
    "SCALE: tiny characters (Little Thumb / Poucet, elves) are TINY: the top of their hat is below the hero's knee when the hero stands, below the hero's chest when the hero crouches; if one is as big as the hero, reaches the hero's waist or shoulder, or sits on a full-size chair, answer no. The parent, if present, is clearly an ADULT, much bigger than the child and never dressed like the child; otherwise answer no.",
    "The characters named in the scene are all present (the hero included), and the objects that matter to the story are there (ignore small props that are hard to see). Pebbles drawn by the child are separate, never a paved path or stepping stones.",
    "The image is free of everything forbidden: no letters or signs, no wrong hands, nothing frightening.",
    "The text area is calm and integrated into the scene (not a flat band or empty box).",
  ];
}
