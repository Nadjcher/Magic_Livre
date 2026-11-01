/**
 * Types de livres selon la tranche d'âge. Chaque format impose une STRUCTURE
 * d'écriture (en plus des consignes d'âge) : un imagier pour un enfant de
 * 2 ans n'a rien à voir avec une enquête pour un enfant de 9 ans.
 *
 * Source unique : formulaire, validation serveur et prompt s'appuient dessus.
 */

export interface BookFormat {
  id: string;
  label: string;
  emoji: string;
  /** Tranche d'âge conseillée (inclusive). */
  ageMin: number;
  ageMax: number;
  description: string;
  /** Nombre de pages imposé (sinon : la longueur choisie par le parent). */
  pages?: { min: number; max: number };
  /** Consignes de structure, injectées dans la demande à l'IA. */
  brief: string;
  /** Indication ajoutée aux scènes d'illustration (en anglais). */
  illustration?: string;
}

export const BOOK_FORMATS: BookFormat[] = [
  {
    id: "imagier",
    label: "Imagier des premiers mots",
    emoji: "🧸",
    ageMin: 1,
    ageMax: 3,
    description: "Une image, un mot, une petite phrase. Pour pointer du doigt et nommer.",
    pages: { min: 7, max: 8 },
    brief:
      "FORMAT IMAGIER : chaque page présente UN objet, animal ou geste du quotidien que l'enfant croise " +
      "dans sa journée (avec un fil très léger : la journée de l'enfant, du réveil au dodo). Texte : 1 phrase " +
      "de 3 à 6 mots, avec le mot-clé bien en évidence (« Voici la balle rouge de Léo. »). Une petite " +
      "question pour l'enfant toutes les 2 pages (« Où est le chat ? »). Pas d'intrigue, pas de suspense.",
    illustration:
      "very simple composition, ONE big clearly identifiable object or action in the center, plain soft background",
  },
  {
    id: "comptine",
    label: "Comptine rimée",
    emoji: "🎵",
    ageMin: 1,
    ageMax: 4,
    description: "Des vers qui riment et un refrain à chanter ensemble.",
    pages: { min: 7, max: 8 },
    brief:
      "FORMAT COMPTINE : tout le texte est en VERS courts qui RIMENT (2 à 4 vers par page, rimes riches et " +
      "naturelles, rythme régulier facile à scander). Un refrain de 2 vers revient 3 fois (début, milieu, fin). " +
      "Petite progression simple (compter de 1 à 5, les animaux qui se réveillent, etc.). Les rimes doivent " +
      "être justes et la grammaire parfaite : mieux vaut une rime simple qu'une phrase tordue.",
  },
  {
    id: "album",
    label: "Album illustré",
    emoji: "📖",
    ageMin: 3,
    ageMax: 7,
    description: "Le grand classique : une histoire tendre avec une petite quête.",
    brief:
      "FORMAT ALBUM : une vraie histoire courte avec un début, une petite quête ou un souci, une " +
      "résolution maligne et une fin douce. Texte et image se répondent sur chaque page.",
  },
  {
    id: "cherche",
    label: "Cherche et trouve",
    emoji: "🔍",
    ageMin: 3,
    ageMax: 7,
    description: "À chaque page, un petit objet à retrouver dans l'image.",
    brief:
      "FORMAT CHERCHE ET TROUVE : une histoire simple où le héros cherche quelque chose. CHAQUE page se " +
      "termine par un défi adressé à l'enfant qui lit : « Et toi, vois-tu … caché(e) quelque part ? ». " +
      "L'objet à trouver est PETIT mais visible, et il est décrit précisément dans scene_illustration " +
      "(ex. « a tiny blue key hidden among the flowers, bottom left »). Le dernier défi révèle la surprise.",
    illustration:
      "richly detailed busy scene full of small charming details, with the hidden object small but clearly visible",
  },
  {
    id: "aventure",
    label: "Grande aventure",
    emoji: "🗺️",
    ageMin: 5,
    ageMax: 10,
    description: "Une quête palpitante avec des épreuves, des alliés et un final épique.",
    brief:
      "FORMAT GRANDE AVENTURE : une quête avec un objectif clair, 2 ou 3 épreuves de difficulté croissante " +
      "(résolues par la ruse, le courage ou l'amitié, jamais par la violence), un allié inattendu, un " +
      "rebondissement vers les deux tiers, et un final spectaculaire et joyeux. Dialogues vivants.",
  },
  {
    id: "enquete",
    label: "Enquête à résoudre",
    emoji: "🕵️",
    ageMin: 7,
    ageMax: 12,
    description: "Un mystère, des indices à repérer, et l'enfant devine avant la fin.",
    brief:
      "FORMAT ENQUÊTE : un mystère gentil (objet disparu, phénomène étrange…). Le héros découvre 3 INDICES " +
      "bien identifiables, chacun sur une page différente et visible dans l'illustration. Une fausse piste " +
      "amusante. Avant-dernière page : « As-tu deviné ? » ; dernière page : la solution logique, qui découle " +
      "des indices (jamais tirée du chapeau). Aucun méchant effrayant : le coupable est attachant.",
    illustration: "the clue mentioned in the text is clearly visible in the scene",
  },
  {
    id: "roman",
    label: "Mini-roman en chapitres",
    emoji: "📚",
    ageMin: 8,
    ageMax: 12,
    description: "Pour les lecteurs autonomes : des chapitres, plus de texte, plus d'aventure.",
    pages: { min: 10, max: 12 },
    brief:
      "FORMAT MINI-ROMAN : chaque page est un court CHAPITRE qui commence par son titre entre guillemets " +
      "(« Chapitre 1 — La lettre bleue »), 6 à 9 phrases riches, dialogues, un suspense léger en fin de " +
      "chapitre qui donne envie de tourner la page. Vocabulaire riche mais compréhensible pour l'âge.",
  },
];

export const BOOK_FORMAT_IDS = BOOK_FORMATS.map((f) => f.id) as [string, ...string[]];

export function findFormat(id: string | undefined): BookFormat | undefined {
  return BOOK_FORMATS.find((f) => f.id === id);
}

/** Formats adaptés à un âge (avec un an de tolérance de chaque côté). */
export function formatsPourAge(age: number): BookFormat[] {
  return BOOK_FORMATS.filter((f) => age >= f.ageMin - 1 && age <= f.ageMax + 1);
}

/** Format conseillé par défaut pour un âge. */
export function formatParDefaut(age: number): BookFormat {
  if (age <= 2) return BOOK_FORMATS[0]!;
  if (age <= 6) return findFormat("album")!;
  if (age <= 8) return findFormat("aventure")!;
  return findFormat("enquete")!;
}
