/**
 * Club : la sélection du mois. Chaque mois, on PROPOSE à chaque enfant une
 * sélection de livres (autant que le quota de la formule : 4 ou 8), adaptée à
 * son âge : le thème de saison, des grands classiques et des histoires variées.
 * Le parent n'a rien à remplir : un clic sur « Recevoir » et le livre est écrit
 * et illustré avec le même héros que ses livres précédents.
 *
 * La sélection est déterministe (même mois + même âge = même sélection) et
 * tourne d'un mois à l'autre.
 */

import { THEMES as TOUS, themeOuvert, type Theme } from "./themes";

/** Seulement les histoires disponibles (celles qui ont une histoire validée). */
const THEMES = TOUS.filter((t) => themeOuvert(t.id));
import { formatParDefaut } from "./bookFormats";
import { stylesPourAge, type IllustrationStyle } from "./style_config";

export interface LivrePropose {
  theme: Theme;
  format: string;
  style: IllustrationStyle;
}

/** Thème de saison selon le mois (1 = janvier). */
const SAISON: Record<number, string> = { 3: "paques", 4: "paques", 9: "rentree", 10: "halloween", 11: "noel", 12: "noel" };

/** Thèmes « petite enfance » qu'on ne propose pas aux grands. */
const PETITS = new Set(["pot", "grand-lit", "petit-frere"]);

function tourner<T>(liste: T[], depart: number, n: number): T[] {
  if (liste.length === 0) return [];
  return Array.from({ length: Math.min(n, liste.length) }, (_, i) => liste[(depart + i) % liste.length]!);
}

export function cleMois(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function nomMois(d = new Date()): string {
  return d.toLocaleDateString("fr-FR", { month: "long" });
}

export function selectionDuMois(age: number, n: number, d = new Date()): LivrePropose[] {
  const mois = d.getMonth() + 1;
  const index = d.getFullYear() * 12 + mois;
  const saison = THEMES.find((t) => t.id === SAISON[mois]);
  const classiques = THEMES.filter((t) => t.categorie === "classiques");
  const autres = THEMES.filter(
    (t) =>
      t.categorie !== "classiques" &&
      t.id !== saison?.id &&
      !Object.values(SAISON).includes(t.id) && // pas de Pâques en novembre
      !(age >= 7 && PETITS.has(t.id)),
  );

  const choix: Theme[] = [];
  if (saison) choix.push(saison);
  if (classiques.length) choix.push(...tourner(classiques, (index * 3) % classiques.length, Math.ceil(n / 2)));
  if (autres.length) choix.push(...tourner(autres, (index * 5) % autres.length, n - choix.length));

  const styles = stylesPourAge(age);
  const format = formatParDefaut(age).id;
  return choix.slice(0, n).map((theme) => ({
    theme,
    format,
    style: theme.style && styles.includes(theme.style) ? theme.style : styles[0]!,
  }));
}
