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
import { HISTOIRES_MAITRESSES } from "./histoiresMaitresses";

export type ThemeCategory = "classiques" | "fetes" | "grandir" | "emotions" | "aventures" | "passions";

export const THEME_CATEGORIES: { id: ThemeCategory; label: string; emoji: string }[] = [
  { id: "classiques", label: "Grands classiques", emoji: "👑" },
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

/** Les grands classiques revisités sont réservés aux membres du Club. */
export function estClassique(t: Theme | undefined): boolean {
  return t?.categorie === "classiques";
}

/** Le thème a une histoire maîtresse (écrite et validée une fois pour toutes). */
export function aMaitresse(id: string | undefined): boolean {
  return Boolean(id) && HISTOIRES_MAITRESSES.some((h) => h.themeId === id);
}

/**
 * Thèmes proposés : seulement ceux qui ont une histoire maîtresse validée (les
 * autres sont « Bientôt »), plus ceux ouverts par NEXT_PUBLIC_THEMES_OUVERTS
 * (liste d'identifiants, ou « * » pour tout rouvrir), puis redéploiement.
 */
const THEMES_FORCES = (process.env.NEXT_PUBLIC_THEMES_OUVERTS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
export function themeOuvert(id: string | undefined, age?: number): boolean {
  if (!id) return false;
  if (THEMES_FORCES.includes("*") || THEMES_FORCES.includes(id)) return true;
  // Une histoire maîtresse a sa tranche d'âge (ex. le Petit Poucet : 4 à 8 ans).
  return HISTOIRES_MAITRESSES.some((h) => h.themeId === id && h.ouverte !== false && (age === undefined || (age >= h.ageMin && age <= h.ageMax)));
}

/** Réservé au Club : un classique sans histoire maîtresse (celles-ci sont ouvertes à tous). */
export function reserveClub(t: Theme | undefined): boolean {
  return estClassique(t) && !aMaitresse(t?.id);
}

/** Consigne commune : relecture libre d'un conte du domaine public. */
function classique(conte: string, elements: string, adaptation: string): string {
  return (
    `GRAND CLASSIQUE REVISITÉ : réécris librement « ${conte} » (œuvre du domaine public). L'enfant devient le ` +
    `héros ou l'héroïne de cette histoire. Garde les moments emblématiques que les parents reconnaîtront : ` +
    `${elements}. ${adaptation} Version douce adaptée à l'âge : aucune violence, personne n'est mangé ni blessé, ` +
    "les « méchants » sont surtout maladroits ou finissent par changer. N'utilise AUCUN élément propre aux " +
    "adaptations au cinéma ou en dessin animé (noms inventés par les studios, chansons, apparence des personnages)."
  );
}

const CLASSIQUES: Theme[] = [
  { id: "chaperon-rouge", titre: "Le Petit Chaperon rouge", emoji: "🧺", categorie: "classiques", style: "classique",
    accroche: "La galette, le pot de beurre… et un loup bien trop gourmand.",
    brief: classique("Le Petit Chaperon rouge", "la cape rouge, le panier pour Mère-Grand, le chemin dans la forêt, le loup et le célèbre « Mère-Grand, comme vous avez de grandes oreilles ! »", "L'enfant déjoue le loup par sa malice, et le loup finit par devenir gentil.") },
  { id: "trois-petits-cochons", titre: "Les Trois Petits Cochons", emoji: "🐷", categorie: "classiques", style: "anim3d",
    accroche: "Paille, bois ou briques : qui construira la maison la plus solide ?",
    brief: classique("Les Trois Petits Cochons", "les trois maisons de paille, de bois et de briques, le loup qui souffle « Je vais souffler et ta maison s'envolera ! »", "L'enfant aide les trois petits cochons à bâtir et à rester unis.") },
  { id: "boucle-d-or", titre: "Boucle d'or et les trois ours", emoji: "🐻", categorie: "classiques", style: "aquarelle",
    accroche: "Trois bols, trois chaises, trois lits… et une petite visite surprise.",
    brief: classique("Boucle d'or et les trois ours", "la maison des trois ours, les bols de porridge trop chaud, trop froid, juste bien, la petite chaise cassée, les trois lits", "L'enfant prend la place de Boucle d'or, s'excuse et devient l'ami des oursons.") },
  { id: "haricot-magique", titre: "Jack et le haricot magique", emoji: "🌱", categorie: "classiques", style: "aventure",
    accroche: "Un haricot qui pousse jusqu'au ciel, et un géant au château des nuages.",
    brief: classique("Jack et le haricot magique", "la vache échangée contre des haricots, la tige géante qui monte jusqu'aux nuages, le château du géant, la poule aux œufs d'or et la harpe qui chante", "Le géant est bougon mais pas méchant, et l'enfant s'en fait un ami.") },
  { id: "hansel-gretel", titre: "La Maison en pain d'épices", emoji: "🍬", categorie: "classiques", style: "feerique",
    accroche: "Les petits cailloux blancs et une maison toute en friandises.",
    brief: classique("Hansel et Gretel", "les cailloux blancs puis les miettes de pain, la forêt profonde, la maison en pain d'épices et en sucre d'orge", "La sorcière est remplacée par une vieille confiseuse solitaire que l'enfant rend heureuse.") },
  { id: "petit-poucet", titre: "Le Petit Poucet", emoji: "🥾", categorie: "classiques", style: "classique",
    accroche: "Le plus petit, mais le plus malin : les bottes de sept lieues !",
    brief: classique("Le Petit Poucet", "les petits cailloux semés sur le chemin, la forêt, la maison de l'ogre, les bottes de sept lieues", "L'enfant est le plus petit mais le plus malin ; l'ogre est un grand gaillard grognon qui finit par l'aider.") },
  { id: "chat-botte", titre: "Le Chat botté", emoji: "🐱", categorie: "classiques", style: "classique",
    accroche: "Un chat en bottes, très rusé, qui fait de son ami un marquis.",
    brief: classique("Le Chat botté", "le chat qui réclame des bottes et un sac, le « marquis de Carabas », le carrosse du roi, l'ogre qui se transforme en souris", "Le chat est le fidèle complice de l'enfant ; l'ogre devient une souris rigolote et inoffensive.") },
  { id: "vilain-petit-canard", titre: "Le Vilain Petit Canard", emoji: "🦢", categorie: "classiques", style: "aquarelle",
    accroche: "Être différent, et découvrir qu'on est un cygne magnifique.",
    brief: classique("Le Vilain Petit Canard", "l'œuf plus gros que les autres, le caneton moqué parce qu'il est différent, le long hiver, la métamorphose en cygne", "L'enfant accompagne et défend le petit canard ; message tendre sur la différence.") },
  { id: "musiciens-breme", titre: "Les Musiciens de Brême", emoji: "🎺", categorie: "classiques", style: "anim3d",
    accroche: "Un âne, un chien, un chat et un coq partent former un orchestre.",
    brief: classique("Les Musiciens de Brême", "l'âne, le chien, le chat et le coq qui partent pour Brême devenir musiciens, la pyramide d'animaux devant la fenêtre, le grand concert", "L'enfant rejoint l'orchestre ; les voleurs sont de simples farceurs qui s'enfuient en riant.") },
  { id: "lievre-tortue", titre: "Le Lièvre et la Tortue", emoji: "🐢", categorie: "classiques", style: "aquarelle",
    accroche: "« Rien ne sert de courir, il faut partir à point. »",
    brief: classique("Le Lièvre et la Tortue (La Fontaine)", "le pari, le lièvre trop sûr de lui qui fait la sieste, la tortue qui avance pas à pas, la morale « Rien ne sert de courir, il faut partir à point »", "L'enfant est l'arbitre et l'encourageur de la course.") },
  { id: "alice-merveilles", titre: "Au pays des merveilles", emoji: "🐇", categorie: "classiques", style: "feerique",
    accroche: "Suivre un lapin pressé et tomber dans un monde complètement fou.",
    brief: classique("Alice au pays des merveilles (Lewis Carroll)", "le lapin blanc pressé avec sa montre, la chute dans le terrier, la potion « Bois-moi » qui fait rapetisser, le goûter du Chapelier, le chat qui sourit et disparaît, la Reine de cœur", "L'enfant vit l'aventure à la place d'Alice ; la Reine est capricieuse mais pas cruelle. S'inspirer des illustrations anciennes de John Tenniel, pas des films.") },
  { id: "pinocchio", titre: "Pinocchio", emoji: "🪵", categorie: "classiques", style: "classique",
    accroche: "Une marionnette en bois qui rêve de devenir un vrai petit garçon.",
    brief: classique("Pinocchio (Collodi)", "Geppetto le menuisier, la marionnette qui prend vie, le nez qui s'allonge à chaque mensonge, le grillon qui parle, la baleine géante", "L'enfant est l'ami de Pinocchio et l'aide à dire la vérité. Ne pas reprendre l'apparence du dessin animé.") },
  { id: "magicien-oz", titre: "Le Magicien d'Oz", emoji: "🌪️", categorie: "classiques", style: "aventure",
    accroche: "La route de briques jaunes, un épouvantail, un homme en fer et un lion peureux.",
    brief: classique("Le Magicien d'Oz (L. Frank Baum)", "la tornade, la route de briques jaunes, l'épouvantail qui veut un cerveau, le bûcheron en fer qui veut un cœur, le lion qui veut du courage, la Cité d'Émeraude", "L'enfant mène l'équipe ; chacun découvre qu'il avait déjà ce qu'il cherchait. Chaussures argentées (comme dans le livre), pas de souliers de rubis.") },
  { id: "ali-baba", titre: "Ali Baba et la caverne aux trésors", emoji: "💎", categorie: "classiques", style: "aventure",
    accroche: "« Sésame, ouvre-toi ! » et une caverne pleine de merveilles.",
    brief: classique("Ali Baba (Les Mille et Une Nuits)", "la formule « Sésame, ouvre-toi ! », la caverne secrète remplie de trésors, les quarante voleurs, la servante rusée", "Les voleurs deviennent des marchands farceurs ; l'enfant rend chaque trésor à son vrai propriétaire.") },
  { id: "livre-jungle", titre: "Le Livre de la jungle", emoji: "🐺", categorie: "classiques", style: "aventure",
    accroche: "Grandir parmi les loups, avec un ours sage et une panthère protectrice.",
    brief: classique("Le Livre de la jungle (Rudyard Kipling)", "l'enfant élevé par la meute de loups, Baloo l'ours qui enseigne la loi de la jungle, Bagheera la panthère noire, le grand conseil du rocher", "L'enfant vit les aventures de Mowgli ; le tigre est fier mais finit par respecter l'enfant. Ne pas reprendre les chansons ni l'apparence du dessin animé.") },
  { id: "robin-des-bois", titre: "Robin des bois", emoji: "🏹", categorie: "classiques", style: "aventure",
    accroche: "La forêt de Sherwood, un arc, et des amis qui aident les plus pauvres.",
    brief: classique("la légende de Robin des bois", "la forêt de Sherwood, l'arc et la flèche, les joyeux compagnons, le tournoi de tir à l'arc, partager avec ceux qui n'ont rien", "L'enfant est un jeune archer du groupe ; le shérif est un grincheux qui finit par se montrer généreux.") },
];


export const THEMES: readonly Theme[] = [
  ...CLASSIQUES,
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
