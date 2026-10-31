/**
 * Catalogue des thèmes de livres proposés au parent.
 *
 * Chaque thème porte un « brief » destiné au modèle d'écriture : l'intention de
 * l'histoire, ses ingrédients et ce qu'elle doit apporter à l'enfant. Le texte
 * reste unique à chaque création (prénom, âge, étincelle d'originalité).
 *
 * Tous les personnages et univers sont originaux : aucun personnage ou marque
 * sous droits.
 */

import type { IllustrationStyle } from "./style_config";

export type ThemeCategory = "fetes" | "grandir" | "emotions" | "aventures" | "passions";

export const THEME_CATEGORIES: { id: ThemeCategory; label: string; emoji: string }[] = [
  { id: "fetes", label: "Fêtes & occasions", emoji: "🎁" },
  { id: "grandir", label: "Grandir", emoji: "🌱" },
  { id: "emotions", label: "Émotions", emoji: "💛" },
  { id: "aventures", label: "Aventures", emoji: "🗺️" },
  { id: "passions", label: "Passions", emoji: "⭐" },
];

export interface Theme {
  /** Identifiant stable (formulaires, URL ?theme=). */
  id: string;
  titre: string;
  emoji: string;
  categorie: ThemeCategory;
  /** Phrase courte affichée au parent. */
  accroche: string;
  /** Intention de l'histoire, transmise au modèle d'écriture. */
  brief: string;
  /** Style d'illustration conseillé (présélectionné). */
  style?: IllustrationStyle;
  /** Mis en avant (thème de saison). */
  saison?: boolean;
}

export const THEMES: readonly Theme[] = [
  // --- Fêtes & occasions ---
  {
    id: "noel",
    titre: "Le Noël magique",
    emoji: "🎄",
    categorie: "fetes",
    saison: true,
    accroche: "Une nuit de Noël où l'enfant aide la magie à opérer.",
    brief:
      "Une aventure de Noël féerique : la veille de Noël, l'enfant découvre qu'il peut aider à faire " +
      "briller la magie des fêtes (lutins originaux, rennes inventés, traîneau, village enneigé). Chaleur " +
      "du foyer, générosité, émerveillement, et une fin douce au pied du sapin.",
    style: "feerique",
  },
  {
    id: "anniversaire",
    titre: "Mon anniversaire extraordinaire",
    emoji: "🎂",
    categorie: "fetes",
    accroche: "Le jour où l'on grandit d'un an… et où tout devient possible.",
    brief:
      "Le jour de l'anniversaire de l'enfant, une surprise extraordinaire l'entraîne dans une aventure " +
      "joyeuse (gâteau magique, invités inattendus, vœu qui se réalise). Fierté de grandir, amitié, fête.",
  },
  {
    id: "halloween",
    titre: "Halloween tout doux",
    emoji: "🎃",
    categorie: "fetes",
    accroche: "Des citrouilles, des déguisements… et zéro frayeur.",
    brief:
      "Une soirée d'Halloween drôle et rassurante : déguisements, citrouilles lumineuses, petits monstres " +
      "rigolos et gentils. Les « peurs » se révèlent toujours amusantes. JAMAIS effrayant.",
  },
  {
    id: "paques",
    titre: "La grande chasse aux œufs",
    emoji: "🐣",
    categorie: "fetes",
    accroche: "Une chasse aux œufs qui mène bien plus loin que le jardin.",
    brief:
      "Une chasse aux œufs de printemps qui se transforme en jeu de piste magique (indices, cloches, " +
      "animaux du printemps inventés). Partage du butin et joie de la découverte.",
  },
  {
    id: "surprise-parents",
    titre: "Une surprise pour maman ou papa",
    emoji: "💝",
    categorie: "fetes",
    accroche: "Pour la fête des mères, des pères… ou juste pour dire je t'aime.",
    brief:
      "L'enfant prépare en secret une surprise pour son parent (cadeau fabriqué, quête d'un objet précieux). " +
      "Obstacles amusants, débrouillardise, et une fin pleine de tendresse et de câlins.",
  },

  // --- Grandir ---
  {
    id: "rentree",
    titre: "Mon premier jour d'école",
    emoji: "🎒",
    categorie: "grandir",
    accroche: "Pour aborder la rentrée avec confiance et le sourire.",
    brief:
      "Le premier jour d'école (ou de crèche) : petite appréhension au départ, découvertes, un premier ami, " +
      "une maîtresse bienveillante, et l'enfant rentre fier et heureux. Rassurer sur la séparation.",
  },
  {
    id: "petit-frere",
    titre: "Un bébé arrive à la maison",
    emoji: "👶",
    categorie: "grandir",
    accroche: "Pour accueillir un petit frère ou une petite sœur.",
    brief:
      "L'arrivée d'un bébé dans la famille : l'enfant se demande s'il sera toujours aimé, puis découvre son " +
      "rôle unique de grand frère ou grande sœur. Amour inchangé des parents, fierté, complicité naissante.",
  },
  {
    id: "petite-souris",
    titre: "La visite de la petite souris",
    emoji: "🦷",
    categorie: "grandir",
    accroche: "Une dent tombe… et une aventure commence sous l'oreiller.",
    brief:
      "L'enfant perd une dent et rencontre la petite souris (version originale), qui l'emmène dans son monde " +
      "secret. Fierté de grandir, émerveillement, et retour au lit avec une surprise.",
  },
  {
    id: "velo",
    titre: "J'apprends le vélo",
    emoji: "🚲",
    categorie: "grandir",
    accroche: "Tomber, recommencer… et filer comme le vent.",
    brief:
      "L'enfant apprend à faire du vélo : premières chutes sans gravité, persévérance, encouragements, et la " +
      "joie immense de réussir. Message : on progresse en essayant encore.",
  },
  {
    id: "pot",
    titre: "Au revoir les couches",
    emoji: "🚽",
    categorie: "grandir",
    accroche: "Une histoire tendre et drôle pour l'apprentissage du pot.",
    brief:
      "L'apprentissage de la propreté raconté avec humour et douceur : petites réussites, petits ratés sans " +
      "importance, fierté. Ton très rassurant, adapté aux tout-petits.",
  },
  {
    id: "grand-lit",
    titre: "Je dors dans mon grand lit",
    emoji: "🛏️",
    categorie: "grandir",
    accroche: "Pour passer au grand lit et dormir seul, serein.",
    brief:
      "L'enfant passe à son grand lit / apprend à dormir seul. Son lit devient un vaisseau de rêves ; il " +
      "découvre que sa chambre est un lieu sûr. Rituel du coucher apaisant, fin endormie.",
  },
  {
    id: "demenagement",
    titre: "Notre nouvelle maison",
    emoji: "🏡",
    categorie: "grandir",
    accroche: "Déménager, c'est aussi découvrir un nouveau royaume.",
    brief:
      "La famille déménage : l'enfant quitte un lieu aimé, puis explore la nouvelle maison comme un " +
      "territoire plein de secrets et se fait de nouveaux amis. Transformer l'inquiétude en curiosité.",
  },
  {
    id: "docteur",
    titre: "Même pas peur du docteur",
    emoji: "🩺",
    categorie: "grandir",
    accroche: "Pour une visite chez le médecin (ou un vaccin) en toute confiance.",
    brief:
      "Une visite chez le médecin vécue comme une mission de héros : le docteur est bienveillant, chaque " +
      "geste est expliqué simplement, et l'enfant repart fier de son courage.",
  },

  // --- Émotions ---
  {
    id: "peur-du-noir",
    titre: "La nuit n'est pas si noire",
    emoji: "🌙",
    categorie: "emotions",
    accroche: "Apprivoiser la nuit et ses ombres, en douceur.",
    brief:
      "L'enfant a peur du noir ; les ombres se révèlent être des amis lumineux et gentils de la nuit " +
      "(étoiles, lucioles, lune). Il découvre que la nuit est douce et protectrice. Fin endormie et sereine.",
    style: "feerique",
  },
  {
    id: "colere",
    titre: "Le petit volcan de colère",
    emoji: "🌋",
    categorie: "emotions",
    accroche: "Comprendre sa colère et apprendre à la calmer.",
    brief:
      "L'enfant ressent une grosse colère (représentée par un petit volcan ou une tempête intérieure). Il " +
      "apprend des astuces simples pour la calmer (respirer, en parler, se défouler doucement). Bienveillance.",
  },
  {
    id: "timidite",
    titre: "Le courage de dire bonjour",
    emoji: "🌷",
    categorie: "emotions",
    accroche: "Pour les enfants timides qui ont un trésor à partager.",
    brief:
      "Un enfant timide découvre peu à peu qu'il peut oser : un petit pas après l'autre, il se fait un ami. " +
      "Valoriser la douceur et la sensibilité, sans forcer.",
  },
  {
    id: "confiance",
    titre: "Je suis capable !",
    emoji: "💪",
    categorie: "emotions",
    accroche: "Une histoire pour croire en soi.",
    brief:
      "L'enfant pense qu'il n'y arrivera pas, puis découvre, grâce à une aventure, qu'il possède des qualités " +
      "uniques (imagination, gentillesse, persévérance). Message fort et joyeux de confiance en soi.",
  },
  {
    id: "partage",
    titre: "Le trésor du partage",
    emoji: "🤝",
    categorie: "emotions",
    accroche: "Partager rend le monde plus beau.",
    brief:
      "L'enfant possède un objet précieux et apprend, au fil d'une aventure, que partager multiplie la joie. " +
      "Amitié, générosité, sans moralisme lourd.",
  },

  // --- Aventures ---
  {
    id: "dinosaures",
    titre: "Au pays des dinosaures",
    emoji: "🦕",
    categorie: "aventures",
    accroche: "Un voyage dans le temps chez des dinosaures très sympathiques.",
    brief:
      "L'enfant voyage au temps des dinosaures (gentils et rigolos) : un bébé dinosaure à aider, des volcans " +
      "endormis, de grandes découvertes. Aventure palpitante mais rassurante.",
    style: "aventure",
  },
  {
    id: "espace",
    titre: "Mission dans les étoiles",
    emoji: "🚀",
    categorie: "aventures",
    accroche: "Une fusée, des planètes inconnues, et un nouvel ami extraterrestre.",
    brief:
      "L'enfant devient astronaute : fusée, planètes inventées aux couleurs incroyables, un petit extraterrestre " +
      "attachant à aider. Émerveillement cosmique, retour à la maison.",
  },
  {
    id: "pirates",
    titre: "Le trésor des pirates gentils",
    emoji: "🏴‍☠️",
    categorie: "aventures",
    accroche: "Hissez les voiles ! Une chasse au trésor sur les océans.",
    brief:
      "L'enfant devient capitaine d'un équipage de pirates gentils : carte au trésor, île mystérieuse, énigmes. " +
      "Le vrai trésor se révèle surprenant. Aucune violence.",
    style: "aventure",
  },
  {
    id: "licornes",
    titre: "Le royaume des licornes",
    emoji: "🦄",
    categorie: "aventures",
    accroche: "Des arcs-en-ciel, des licornes et une mission enchantée.",
    brief:
      "L'enfant entre dans un royaume de licornes et d'arcs-en-ciel où il doit aider à rendre ses couleurs au " +
      "ciel. Magie, amitié, paillettes et douceur.",
    style: "feerique",
  },
  {
    id: "ocean",
    titre: "Le secret des océans",
    emoji: "🐠",
    categorie: "aventures",
    accroche: "Une plongée au cœur d'un monde sous-marin merveilleux.",
    brief:
      "L'enfant peut respirer sous l'eau et explore un monde sous-marin lumineux : poissons qui parlent, " +
      "cité de corail, une baleine à aider. Respect de la nature, émerveillement.",
    style: "aquarelle",
  },
  {
    id: "chevaliers",
    titre: "Le château et le dragon",
    emoji: "🏰",
    categorie: "aventures",
    accroche: "Un château, un dragon… qui avait juste besoin d'un ami.",
    brief:
      "L'enfant, jeune chevalier ou princesse aventurière, part à la rencontre d'un dragon dont on a peur, et " +
      "découvre qu'il est seul et gentil. Courage, malice, amitié ; jamais de combat.",
  },
  {
    id: "super-heros",
    titre: "Le super-héros de la maison",
    emoji: "🦸",
    categorie: "aventures",
    accroche: "Et si votre enfant avait un super-pouvoir bien à lui ?",
    brief:
      "L'enfant découvre un super-pouvoir original (inventé, jamais celui d'un personnage connu) et l'utilise " +
      "pour aider les autres de façon drôle et généreuse. Fierté, entraide, humour.",
    style: "bd",
  },
  {
    id: "foret-enchantee",
    titre: "La forêt enchantée",
    emoji: "🌳",
    categorie: "aventures",
    accroche: "Des arbres qui parlent et des sentiers pleins de secrets.",
    brief:
      "L'enfant suit un sentier dans une forêt enchantée : arbres qui chuchotent, créatures originales, une " +
      "énigme à résoudre pour sauver un lieu magique. Poésie et merveilleux.",
    style: "feerique",
  },
  {
    id: "safari",
    titre: "Safari dans la savane",
    emoji: "🦁",
    categorie: "aventures",
    accroche: "Lions, girafes et éléphants pour un grand voyage.",
    brief:
      "L'enfant part en safari et se lie d'amitié avec les animaux de la savane, qu'il aide à résoudre un " +
      "problème (point d'eau, bébé égaré). Découverte, nature, entraide.",
    style: "aventure",
  },

  // --- Passions ---
  {
    id: "foot",
    titre: "Le grand match",
    emoji: "⚽",
    categorie: "passions",
    accroche: "Pour les petits footballeurs (et le vrai sens de l'équipe).",
    brief:
      "Un match de foot qui prend une tournure magique (ballon enchanté, stade extraordinaire). L'enfant " +
      "apprend l'esprit d'équipe, le fair-play, et que s'amuser compte plus que gagner.",
  },
  {
    id: "danse",
    titre: "Le spectacle de danse",
    emoji: "🩰",
    categorie: "passions",
    accroche: "Le trac, la scène, et la magie du spectacle.",
    brief:
      "L'enfant prépare un spectacle de danse : trac, répétitions, une chorégraphie qui prend vie de façon " +
      "magique, et un final applaudi. Confiance, expression, joie.",
  },
  {
    id: "cuisine",
    titre: "Le petit chef",
    emoji: "🧁",
    categorie: "passions",
    accroche: "Une recette magique… qui fait des miracles.",
    brief:
      "L'enfant cuisine une recette magique aux effets inattendus et drôles (gâteau qui fait voler, soupe qui " +
      "fait rire). Créativité, gourmandise, partage du repas en famille.",
  },
  {
    id: "pompier",
    titre: "Petit pompier courageux",
    emoji: "🚒",
    categorie: "passions",
    accroche: "Un camion rouge, une sirène et une mission d'entraide.",
    brief:
      "L'enfant devient pompier le temps d'une journée : camion, caserne, sauvetage doux (un chat dans un " +
      "arbre, un jardin à arroser). Courage, entraide, aucune situation effrayante.",
  },
  {
    id: "animal",
    titre: "Mon animal et moi",
    emoji: "🐶",
    categorie: "passions",
    accroche: "Une aventure avec son animal de compagnie (réel ou rêvé).",
    brief:
      "L'enfant vit une aventure extraordinaire avec un animal de compagnie qui se met à parler (chien, chat, " +
      "lapin…). Complicité, responsabilité, tendresse.",
  },
];

/** Retrouve un thème par son identifiant. */
export function findThemeById(id: string | undefined | null): Theme | undefined {
  if (!id) return undefined;
  return THEMES.find((t) => t.id === id);
}
