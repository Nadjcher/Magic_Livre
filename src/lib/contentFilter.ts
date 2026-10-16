/**
 * Filtre de contenu isolé et testé.
 *
 * Il vérifie à la fois la saisie de l'utilisateur et la sortie du modèle.
 * Il refuse : violence graphique, peur extrême, contenu sexuel, discrimination,
 * incitation dangereuse, et plus généralement tout contenu inadapté à un enfant.
 *
 * Le rapprochement se fait sur des mots/expressions entiers (limites de mots)
 * afin d'éviter les faux positifs (ex : « nu » ne doit pas matcher « nuage »).
 * Cette fonction ne dépend d'aucun service externe, afin de rester testable.
 */

import { normalizeForMatch } from "./protectedCharacters";

/** Catégories de contenu refusé. */
export type FilterCategory =
  | "violence"
  | "peur"
  | "sexuel"
  | "discrimination"
  | "incitation_dangereuse";

export interface ContentFilterResult {
  /** true si le contenu est acceptable pour un enfant. */
  ok: boolean;
  /** Catégories problématiques détectées. */
  categories: FilterCategory[];
  /** Message en français expliquant le refus (vide si ok). */
  message: string;
}

/**
 * Dictionnaire de termes/expressions interdits par catégorie. Les termes sont
 * normalisés (minuscules, sans accents) et recherchés sur des limites de mots.
 */
const BLOCKLIST: Record<FilterCategory, string[]> = {
  violence: [
    "tuer",
    "tue",
    "tuee",
    "meurtre",
    "assassin",
    "assassiner",
    "sang",
    "sanglant",
    "egorger",
    "poignarder",
    "poignard",
    "fusil",
    "pistolet",
    "arme a feu",
    "bombe",
    "torture",
    "torturer",
    "mutiler",
    "decapiter",
    "massacre",
    "cadavre",
    "agonie",
  ],
  peur: [
    "terreur",
    "epouvante",
    "demon",
    "demoniaque",
    "enfer",
    "fantome terrifiant",
    "monstre qui devore",
  ],
  sexuel: [
    "sexe",
    "sexuel",
    "sexuelle",
    "nu",
    "nue",
    "nudite",
    "porno",
    "pornographie",
    "erotique",
    "caresse intime",
  ],
  discrimination: [
    "race inferieure",
    "sale juif",
    "sale arabe",
    "sale noir",
    "negre",
    "bougnoule",
    "pede",
    "tapette",
    "ferme ta gueule",
  ],
  incitation_dangereuse: [
    "fabriquer une bombe",
    "avaler des medicaments",
    "jouer avec le feu",
    "jouer avec des allumettes",
    "sauter du toit",
    "boire de l'eau de javel",
    "se faire du mal",
    "monter dans la voiture d'un inconnu",
  ],
};

/** Messages explicatifs par catégorie (affichés à l'utilisateur, en français). */
const CATEGORY_MESSAGES: Record<FilterCategory, string> = {
  violence: "des scènes de violence",
  peur: "des éléments trop effrayants",
  sexuel: "un contenu à caractère sexuel",
  discrimination: "des propos discriminatoires",
  incitation_dangereuse: "une incitation à un comportement dangereux",
};

/**
 * Indique si un terme (déjà normalisé) apparaît comme mot/expression entier
 * dans le texte normalisé fourni.
 */
function matchesTerm(normalizedHaystack: string, normalizedTerm: string): boolean {
  if (normalizedTerm.length === 0) return false;
  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`,
    "u",
  );
  return pattern.test(normalizedHaystack);
}

/**
 * Analyse un texte et renvoie le résultat du filtrage.
 */
export function filterContent(input: string): ContentFilterResult {
  const haystack = ` ${normalizeForMatch(input)} `;
  const categories: FilterCategory[] = [];

  for (const category of Object.keys(BLOCKLIST) as FilterCategory[]) {
    const terms = BLOCKLIST[category];
    const hit = terms.some((term) => matchesTerm(haystack, normalizeForMatch(term)));
    if (hit) {
      categories.push(category);
    }
  }

  if (categories.length === 0) {
    return { ok: true, categories: [], message: "" };
  }

  const raisons = categories.map((c) => CATEGORY_MESSAGES[c]).join(", ");
  return {
    ok: false,
    categories,
    message:
      "Ce texte ne peut pas être utilisé car il contient " +
      `${raisons}. Merci de proposer une histoire douce et adaptée aux enfants.`,
  };
}

/**
 * Vérifie la sortie complète du modèle (titre + toutes les pages).
 */
export function filterStory(story: {
  titre: string;
  pages: { texte: string; scene_illustration: string }[];
}): ContentFilterResult {
  const fullText = [
    story.titre,
    ...story.pages.flatMap((p) => [p.texte, p.scene_illustration]),
  ].join(" \n ");
  return filterContent(fullText);
}
