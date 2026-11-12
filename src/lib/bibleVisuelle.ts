/**
 * La bible visuelle d'Encore une histoire (11 nov. 2026, section « La bible
 * visuelle » du document « Bible féerique et grille de relecture »).
 * Le style de la maison, « L'album d'Encore une histoire » : une page d'album
 * peinte, chaude et pleine. Donnée au générateur d'images (en anglais, ce que
 * le générateur comprend le mieux) et à la relectrice d'images.
 */

/** Le style de la maison (peint). */
export const STYLE_MAISON = "maison";
/** Le style 3D (celui de la page d'accueil et du catalogue). */
export const STYLE_3D = "anim3d";

/** Styles soumis à la bible visuelle : pages carrées, consigne type, relectrice à grille. */
export function estCarre(style: string | undefined): boolean {
  return style === STYLE_MAISON || style === STYLE_3D;
}

/** « Consigne type » : bloc STYLE (fixe). */
export const CONSIGNE_STYLE =
  "STYLE (fixed): a children's picture-book page hand-painted in watercolor and gouache, soft textures, visible paper grain, " +
  "shapes modelled by color and light with NO ink outlines, never 3D, never anime or manga, never photographic, never flat cartoon shading. " +
  "Full-bleed scenery to every edge, square format, no empty paper anywhere. " +
  "Palette: deep night blue (sky, distances, shadows), moss green and warm brown (foliage, trunks, ground), warm golden light " +
  "(window, lamp, glowing object), ONE accent color tied to the child (pajamas, bonnet or cuddly toy); white is reserved for what the child draws. " +
  "Daytime scenes keep the same hues, lightened: never bright saturated colors. " +
  "LIGHT: a single main light source, the one named in the scene; it lights the child's face first; small distant lights (a lit window far away, stars) are allowed only if they do not light the characters; the edges of the image are darker than the center.";

/** Bloc STYLE de la 3D : un plan de film d'animation, en un seul rendu cohérent. */
export const CONSIGNE_STYLE_3D =
  "STYLE (fixed): a single frame from a premium modern 3D animated family film: volumetric characters and sets, soft plush and polished materials, " +
  "subsurface skin shading, cinematic composition, rich cosy set dressing. ONE consistent 3D render for the whole image: characters AND scenery are 3D " +
  "(never a 2D drawn, sketched or pencil background, never mixed media, never photographic). Full-bleed to every edge, square format. " +
  "Palette: deep night blue (sky, shadows), warm wood and moss tones, warm golden light (lamp, window, glowing object), ONE accent color tied to the child; " +
  "daytime scenes keep the same hues, lightened, never garish. " +
  "LIGHT: a single main light source, the one named in the scene; it lights the child's face first (soft key light with gentle rim light); small distant " +
  "lights are allowed only if they do not light the characters; the edges of the image are darker than the center.";

/** Bloc HÉROS : traits du portrait validé, répétés à chaque page. */
export function consigneHeros(nom: string | undefined, traits: string | undefined, style?: string): string {
  const yeux =
    style === STYLE_3D
      ? "expressive eyes in proportion (never huge exaggerated eyes); "
      : "natural-sized almond-shaped eyes (never big round cartoon eyes); ";
  return (
    `HERO${nom ? ` (${nom})` : ""}: drawn from the approved portrait (reference image), never from a photo. ` +
    (traits ? `Exact traits: ${traits}. ` : "") +
    yeux +
    "soft smile with the mouth barely open unless the scene asks for laughter; " +
    "proportions of a child of that age (the head is a quarter to a fifth of the body)."
  );
}

/** Personnages fixes (fiches identiques dans tous les livres). */
export const PERSONNAGES_FIXES =
  "FIXED CHARACTERS: a secondary character never looks like the hero. " +
  "Little Thumb (Petit Poucet): straight black hair, red knitted bonnet, brown jacket, a cheerful face; ALWAYS the same tiny size on every page: " +
  "as tall as a boot, his head reaching the child's knee, never taller (show it next to the child or an object). " +
  "The child's cuddly toy: exactly the plush described in the character sheet (its species, colour and shape clearly readable: ears, muzzle, paws), " +
  "soft and cute, never a shapeless blob, no seams or patches, held in the child's arms, never alive. " +
  "The parent: only a hand, a silhouette from behind or a profile in shadow, never a detailed face. " +
  "The giant: never shown, only suggested by a shadow or boots.";

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

/** La grille de la relectrice d'images, style peint (oui / non, avec ce qu'elle voit). */
export const GRILLE_IMAGES = [
  "The hero has the traits of the reference portrait: hair (color and cut), eyes, skin tone, distinctive features (glasses, freckles…).",
  "The technique is painted (watercolor/gouache), with no ink outlines and no 3D.",
  "The scenery fills the whole frame, with no empty area outside the calm text area.",
  "There is a single MAIN light source, the one named in the scene, lighting the hero's face; small distant lights (a far-away window, stars) are fine as long as they do not light the characters.",
  "Fixed characters match their sheet and their scale (a secondary character never resembles the hero; the cuddly toy is a toy, not alive).",
  "The objects named in the scene are present, in the right place.",
  "If the child has drawn something, it is clearly distinct from the painted scenery (white, irregular, shaky outline).",
  "The image is free of everything forbidden: no letters or signs, no wrong hands, nothing frightening.",
  "The text area is calm and integrated into the scene (not a flat band or empty box).",
];

/** La grille de la relectrice d'images, style 3D : mêmes règles, technique 3D. */
export const GRILLE_IMAGES_3D = [
  "The hero has the traits of the reference portrait: hair (color and cut), eyes, skin tone, distinctive features (glasses, freckles…), and the same outfit as the character sheet.",
  "The whole image is ONE consistent 3D animated-film render: characters and scenery are both 3D (no 2D drawn or pencil background, no mixed media, no photo-realism).",
  "The scenery fills the whole frame, with no empty area outside the calm text area.",
  "There is a single MAIN light source, the one named in the scene, lighting the hero's face; small distant lights are fine as long as they do not light the characters.",
  "Fixed characters match their sheet and their scale (a secondary character never resembles the hero; the cuddly toy is a recognisable plush, not alive, not a shapeless blob).",
  "The objects named in the scene are present, in the right place.",
  "If the child has drawn something, it is clearly distinct from the scenery (white, irregular, shaky outline).",
  "The image is free of everything forbidden: no letters or signs, no wrong hands, nothing frightening.",
  "The text area is calm and integrated into the scene (not a flat band or empty box).",
];

/** La grille qui s'applique à un style. */
export function grillePour(style: string | undefined): string[] {
  return style === STYLE_3D ? GRILLE_IMAGES_3D : GRILLE_IMAGES;
}

/** Le bloc STYLE de la consigne type pour un style soumis à la bible. */
export function consigneStylePour(style: string | undefined): string {
  return style === STYLE_3D ? CONSIGNE_STYLE_3D : CONSIGNE_STYLE;
}
