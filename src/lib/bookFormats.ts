/**
 * Types de livres selon la tranche d'âge. Chaque format impose une STRUCTURE
 * d'écriture (en plus des consignes d'âge) : un imagier pour un enfant de
 * 2 ans n'a rien à voir avec une enquête pour un enfant de 9 ans.
 *
 * Source unique : formulaire, validation serveur et prompt s'appuient dessus.
 */

import type { IllustrationStyle } from "./style_config";

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
  /** Style de dessin conseillé pour ce type de livre (présélectionné). */
  styleConseille?: IllustrationStyle;
}

export const BOOK_FORMATS: BookFormat[] = [
  {
    id: "imagier",
    styleConseille: "pastel",
    label: "Imagier des premiers mots",
    emoji: "🧸",
    ageMin: 1,
    ageMax: 3,
    description: "Une image, un mot, une petite phrase. Pour pointer du doigt et nommer.",
    pages: { min: 8, max: 8 },
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
    styleConseille: "aquarelle",
    label: "Comptine rimée",
    emoji: "🎵",
    ageMin: 1,
    ageMax: 4,
    description: "Des vers qui riment et un refrain à chanter ensemble.",
    pages: { min: 8, max: 8 },
    brief:
      "FORMAT COMPTINE : tout le texte est en VERS courts qui RIMENT (2 à 4 vers par page, rimes riches et " +
      "naturelles, rythme régulier facile à scander). Un refrain de 2 vers revient 3 fois (début, milieu, fin). " +
      "Petite progression simple (compter de 1 à 5, les animaux qui se réveillent, etc.). Les rimes doivent " +
      "être justes et la grammaire parfaite : mieux vaut une rime simple qu'une phrase tordue.",
  },
  {
    id: "album",
    styleConseille: "feerique",
    label: "Album illustré",
    emoji: "📖",
    ageMin: 3,
    ageMax: 6,
    description: "Le grand classique : une histoire tendre avec une petite quête.",
    brief:
      "FORMAT ALBUM : une vraie histoire courte avec un début, une petite quête ou un souci, une " +
      "résolution maligne et une fin douce. Texte et image se répondent sur chaque page.",
  },
  {
    id: "cherche",
    styleConseille: "anim3d",
    label: "Cherche et trouve",
    emoji: "🔍",
    ageMin: 4,
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
    styleConseille: "aventure",
    label: "Grande aventure",
    emoji: "🗺️",
    ageMin: 5,
    ageMax: 9,
    description: "Une quête palpitante avec des épreuves, des alliés et un final épique.",
    brief:
      "FORMAT GRANDE AVENTURE : une quête avec un objectif clair, 2 ou 3 épreuves de difficulté croissante " +
      "(résolues par la ruse, le courage ou l'amitié, jamais par la violence), un allié inattendu, un " +
      "rebondissement vers les deux tiers, et un final spectaculaire et joyeux. Dialogues vivants.",
  },
  {
    id: "enquete",
    styleConseille: "bd",
    label: "Enquête à résoudre",
    emoji: "🕵️",
    ageMin: 7,
    ageMax: 11,
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
    styleConseille: "realiste",
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
  {
    id: "dodo",
    styleConseille: "pastel",
    label: "Histoire du soir",
    emoji: "🌙",
    ageMin: 2,
    ageMax: 6,
    description: "Une histoire douce et apaisante, pour s'endormir en souriant.",
    brief:
      "FORMAT HISTOIRE DU SOIR : rythme lent et berçant, phrases douces, beaucoup de sensations calmes (couverture " +
      "chaude, lumière tamisée, respiration lente). Une petite aventure tranquille qui se termine au lit, les yeux " +
      "qui se ferment. Aucune tension forte. Dernière page : un « bonne nuit » tendre adressé à l'enfant.",
    illustration: "calm cozy night atmosphere, soft moonlight, gentle warm lamps, peaceful",
  },
  {
    id: "drole",
    styleConseille: "anim3d",
    label: "Histoire rigolote",
    emoji: "😂",
    ageMin: 4,
    ageMax: 9,
    description: "Des situations absurdes et des gags : fous rires garantis.",
    brief:
      "FORMAT HISTOIRE RIGOLOTE : humour enfantin et absurde (objets qui font n'importe quoi, quiproquos, chutes " +
      "comiques, bruits rigolos, répétition comique en crescendo). Chaque page a au moins un gag. L'humour n'est " +
      "jamais moqueur envers l'enfant. Une chute finale très drôle et tendre.",
    illustration: "funny exaggerated expressions, comedic slapstick moment",
  },
  {
    id: "realiste",
    styleConseille: "realiste",
    label: "Histoire de la vie réelle",
    emoji: "🏫",
    ageMin: 5,
    ageMax: 12,
    description: "Sans magie : l'école, le sport, les amitiés, un défi du quotidien.",
    brief:
      "FORMAT RÉALISTE : AUCUNE magie, aucun animal qui parle. Une histoire de la vraie vie (école, match, " +
      "spectacle, déménagement, nouvelle amitié, petit frère, peur à surmonter) où l'enfant relève un défi crédible " +
      "grâce à son courage, son idée ou l'aide des autres. Personnages humains, dialogues naturels, émotions justes.",
    illustration: "realistic everyday setting, believable people, no fantasy creatures",
  },
  {
    id: "bd",
    styleConseille: "bd",
    label: "Bande dessinée",
    emoji: "💥",
    ageMin: 6,
    ageMax: 12,
    description: "De l'action, des dialogues qui claquent et des rebondissements.",
    brief:
      "FORMAT BANDE DESSINÉE : récit très visuel et dynamique, beaucoup de dialogues courts et percutants, " +
      "onomatopées (Boum ! Zioup !), action et humour. Chaque page est une scène forte, comme une planche de BD, " +
      "avec un rebondissement final.",
    illustration: "dynamic comic panel composition, action lines, expressive poses",
  },
  {
    id: "manga",
    styleConseille: "manga",
    label: "Manga",
    emoji: "⚡",
    ageMin: 7,
    ageMax: 12,
    description: "Amitié, rivalité, entraînement et dépassement de soi, façon manga.",
    brief:
      "FORMAT MANGA : esprit shōnen bienveillant. Le héros a un rêve (devenir le meilleur dans quelque chose), un " +
      "rival respectueux, un mentor, un entraînement, un tournoi ou un défi. Chapitres rythmés, dialogues vifs, " +
      "moment où il veut abandonner puis se relève grâce à ses amis. Aucune violence : les combats sont des " +
      "compétitions, des défis ou des jeux.",
    illustration: "anime action pose, speed lines, intense determined expression",
  },
  {
    id: "scifi",
    styleConseille: "anim3d",
    label: "Science-fiction",
    emoji: "🚀",
    ageMin: 7,
    ageMax: 12,
    description: "Robots, vaisseaux et planètes lointaines : une mission dans le futur.",
    brief:
      "FORMAT SCIENCE-FICTION : futur ou espace, technologie inventée mais cohérente (robot compagnon, vaisseau, " +
      "planète aux règles étranges). Une mission avec un problème scientifique à résoudre par la logique et " +
      "l'observation. Émerveillement et curiosité, fin optimiste.",
    illustration: "futuristic sci-fi setting, spaceships, glowing technology, alien planet",
  },
  {
    id: "fantasy",
    styleConseille: "classique",
    label: "Saga fantastique",
    emoji: "🐉",
    ageMin: 8,
    ageMax: 12,
    description: "Un monde imaginaire, une quête épique et des créatures légendaires.",
    brief:
      "FORMAT SAGA FANTASTIQUE : un monde imaginaire riche (royaumes, forêts anciennes, dragons bienveillants, " +
      "magie avec des règles). Le héros découvre qu'il a un rôle à jouer, réunit une équipe, affronte une épreuve " +
      "épique (énigme, traversée, choix courageux). Ton épique mais jamais effrayant ; fin victorieuse et lumineuse.",
    illustration: "epic fantasy landscape, castles, ancient forests, majestic friendly dragon",
  },
];

export const BOOK_FORMAT_IDS = BOOK_FORMATS.map((f) => f.id) as [string, ...string[]];

export function findFormat(id: string | undefined): BookFormat | undefined {
  return BOOK_FORMATS.find((f) => f.id === id);
}

/** Formats adaptés à un âge (tranche stricte : on ne propose que ce qui lui correspond). */
export function formatsPourAge(age: number): BookFormat[] {
  const a = Math.min(12, Math.max(1, age));
  return BOOK_FORMATS.filter((f) => a >= f.ageMin && a <= f.ageMax);
}

/** Format conseillé par défaut pour un âge. */
export function formatParDefaut(age: number): BookFormat {
  if (age <= 2) return BOOK_FORMATS[0]!;
  if (age <= 4) return findFormat("album")!;
  if (age <= 6) return findFormat("album")!;
  if (age <= 8) return findFormat("aventure")!;
  if (age <= 10) return findFormat("enquete")!;
  return findFormat("roman")!;
}
