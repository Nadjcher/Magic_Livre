/**
 * Couvertures illustrées (3D) des thèmes, dans /public/couvertures/<id>.webp.
 * L'enfant y est vu de dos : chaque enfant peut s'imaginer en héros.
 * Un thème sans couverture garde sa jaquette dessinée (picto).
 */

const DISPONIBLES = new Set([
  "ali-baba",
  "alice-merveilles",
  "animal",
  "anniversaire",
  "boucle-d-or",
  "chaperon-rouge",
  "chat-botte",
  "chevaliers",
  "colere",
  "confiance",
  "cuisine",
  "danse",
  "demenagement",
  "dinosaures",
  "docteur",
  "espace",
  "foot",
  "foret-enchantee",
  "grand-lit",
  "halloween",
  "hansel-gretel",
  "haricot-magique",
  "licornes",
  "lievre-tortue",
  "livre-jungle",
  "magicien-oz",
  "musiciens-breme",
  "noel",
  "ocean",
  "paques",
  "partage",
  "petit-frere",
  "petit-poucet",
  "petite-souris",
  "peur-du-noir",
  "pinocchio",
  "pirates",
  "pompier",
  "pot",
  "rentree",
  "robin-des-bois",
  "safari",
  "super-heros",
  "surprise-parents",
  "timidite",
  "trois-petits-cochons",
  "velo",
  "vilain-petit-canard",
]);

export function couvertureTheme(id: string): string | null {
  return DISPONIBLES.has(id) ? `/couvertures/${id}.webp` : null;
}
