/**
 * Catalogue de héros originaux, créés spécifiquement pour l'application et
 * libres de droits. Ils sont proposés au parent comme alternative aux
 * personnages protégés.
 */

export interface Hero {
  /** Identifiant stable utilisé dans les formulaires. */
  id: string;
  /** Nom du héros (original). */
  nom: string;
  /** Courte description, utilisée dans le prompt de génération. */
  description: string;
  /** Emoji illustratif pour l'interface. */
  emoji: string;
}

export const HEROES: readonly Hero[] = [
  {
    id: "lila-renarde",
    nom: "Lila la petite renarde",
    description:
      "Une renarde curieuse et courageuse qui adore explorer la forêt et aider ses amis.",
    emoji: "🦊",
  },
  {
    id: "tom-astronaute",
    nom: "Tom l'astronaute",
    description:
      "Un jeune astronaute rêveur qui voyage de planète en planète pour découvrir de nouveaux mondes.",
    emoji: "🚀",
  },
  {
    id: "zoe-sirene",
    nom: "Zoé la sirène",
    description:
      "Une sirène joyeuse qui protège les fonds marins et chante avec les poissons.",
    emoji: "🧜",
  },
  {
    id: "noa-chevalier",
    nom: "Noa le petit chevalier",
    description:
      "Un chevalier gentil et malin qui résout les problèmes du royaume sans jamais se battre.",
    emoji: "🛡️",
  },
  {
    id: "maya-exploratrice",
    nom: "Maya l'exploratrice",
    description:
      "Une exploratrice intrépide qui traverse jungles et déserts pour aider les animaux.",
    emoji: "🧭",
  },
  {
    id: "pablo-dragon",
    nom: "Pablo le gentil dragon",
    description:
      "Un petit dragon tout doux qui souffle des bulles de savon au lieu du feu.",
    emoji: "🐲",
  },
  {
    id: "june-inventrice",
    nom: "June la petite inventrice",
    description:
      "Une inventrice pleine d'idées qui construit des machines rigolotes pour aider son village.",
    emoji: "⚙️",
  },
  {
    id: "sacha-ourson",
    nom: "Sacha l'ourson musicien",
    description:
      "Un ourson tendre qui joue de la musique et réconforte tous ses amis de la forêt.",
    emoji: "🎵",
  },
];

/** Retrouve un héros par son identifiant. */
export function findHeroById(id: string): Hero | undefined {
  return HEROES.find((h) => h.id === id);
}
