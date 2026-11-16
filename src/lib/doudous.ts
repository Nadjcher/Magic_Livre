/**
 * Le doudou choisi dans une liste (espèce + couleur) : plus besoin d'une IA
 * pour le deviner, et l'espèce attendue est connue exactement (contrôle des
 * images). Codé dans l'apparence du personnage : « doudou:lapin:gris ».
 */

export const ESPECES_DOUDOU = [
  { id: "lapin", label: "Lapin", son: "son lapin", en: "rabbit with long ears" },
  { id: "ours", label: "Ours", son: "son ours", en: "teddy bear with small round ears and a short muzzle" },
  { id: "chien", label: "Chien", son: "son chien", en: "dog with floppy ears" },
  { id: "chat", label: "Chat", son: "son chat", en: "cat with pointed ears and whiskers" },
  { id: "elephant", label: "Éléphant", son: "son éléphant", en: "elephant with a trunk" },
  { id: "girafe", label: "Girafe", son: "sa girafe", en: "giraffe with a long neck and spots" },
  { id: "licorne", label: "Licorne", son: "sa licorne", en: "unicorn with a little horn" },
  { id: "dinosaure", label: "Dinosaure", son: "son dinosaure", en: "friendly dinosaur" },
  { id: "lion", label: "Lion", son: "son lion", en: "lion with a soft mane" },
  { id: "singe", label: "Singe", son: "son singe", en: "monkey" },
  { id: "panda", label: "Panda", son: "son panda", en: "panda" },
  { id: "mouton", label: "Mouton", son: "son mouton", en: "sheep with curly wool" },
  { id: "renard", label: "Renard", son: "son renard", en: "fox with a bushy tail" },
  { id: "souris", label: "Souris", son: "sa souris", en: "mouse with round ears" },
  { id: "hibou", label: "Hibou", son: "son hibou", en: "owl" },
  { id: "autre", label: "Autre doudou", son: "son doudou", en: "cuddly toy" },
] as const;

export const COULEURS_DOUDOU = [
  { id: "gris", label: "Gris", en: "grey" },
  { id: "marron", label: "Marron", en: "brown" },
  { id: "beige", label: "Beige", en: "beige" },
  { id: "blanc", label: "Blanc", en: "white" },
  { id: "rose", label: "Rose", en: "pink" },
  { id: "bleu", label: "Bleu", en: "light blue" },
  { id: "jaune", label: "Jaune", en: "yellow" },
  { id: "vert", label: "Vert", en: "green" },
  { id: "noir", label: "Noir", en: "black" },
  { id: "multicolore", label: "Multicolore", en: "multicolored" },
] as const;

export interface DoudouChoisi {
  espece: (typeof ESPECES_DOUDOU)[number];
  couleur: (typeof COULEURS_DOUDOU)[number];
}

export const codeDoudou = (espece: string, couleur: string) => `doudou:${espece}:${couleur}`;

/** « doudou:lapin:gris » → l'espèce et la couleur ; null pour une description libre. */
export function lireDoudou(apparence: string | undefined): DoudouChoisi | null {
  const m = /^doudou:([a-z]+):([a-z]+)$/.exec(apparence ?? "");
  if (!m) return null;
  const espece = ESPECES_DOUDOU.find((e) => e.id === m[1]);
  const couleur = COULEURS_DOUDOU.find((c) => c.id === m[2]);
  return espece && couleur ? { espece, couleur } : null;
}

/** Description pour l'illustrateur (anglais). */
export function visuelDoudou(d: DoudouChoisi): string {
  return `a soft plush ${d.couleur.en} ${d.espece.en}, cute and simple`;
}

/** Description lisible (français) : « un lapin en peluche gris ». */
export function texteDoudou(apparence: string | undefined): string | undefined {
  const d = lireDoudou(apparence);
  if (!d) return apparence;
  return `${d.espece.son.replace(/^(son|sa) /, d.espece.son.startsWith("sa") ? "une " : "un ")} en peluche, ${d.couleur.label.toLowerCase()}`;
}
