/**
 * Couvertures illustrées (3D) des thèmes, dans /public/couvertures/<id>.webp.
 * L'enfant y est vu de dos : chaque enfant peut s'imaginer en héros.
 * Un thème sans couverture garde sa jaquette dessinée (picto).
 */

const DISPONIBLES = new Set([
  "ali-baba",
  "alice-merveilles",
  "anniversaire",
  "boucle-d-or",
  "chaperon-rouge",
  "halloween",
  "hansel-gretel",
  "haricot-magique",
  "lievre-tortue",
  "magicien-oz",
  "musiciens-breme",
  "noel",
  "paques",
  "petit-frere",
  "petit-poucet",
  "petite-souris",
  "pinocchio",
  "robin-des-bois",
  "surprise-parents",
  "vilain-petit-canard",
]);

export function couvertureTheme(id: string): string | null {
  return DISPONIBLES.has(id) ? `/couvertures/${id}.webp` : null;
}
