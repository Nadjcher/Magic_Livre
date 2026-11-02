/**
 * Tranches d'âge publiques (pages « livre personnalisé X ans » pour le
 * référencement) : chacune présente les types de livres et les styles adaptés.
 */

export interface AgeGroup {
  slug: string;
  label: string;
  ageMin: number;
  ageMax: number;
  /** Âge représentatif (pour filtrer formats et styles). */
  ageType: number;
  intro: string;
  besoins: string[];
}

export const AGE_GROUPS: AgeGroup[] = [
  {
    slug: "bebe-1-2-ans",
    label: "1 à 2 ans",
    ageMin: 1,
    ageMax: 2,
    ageType: 2,
    intro:
      "À cet âge, on pointe du doigt, on nomme, on répète. Le livre personnalisé devient un imagier où votre " +
      "tout-petit se reconnaît à chaque page : son prénom, son visage, ses objets du quotidien.",
    besoins: ["Phrases très courtes et répétitives", "Une image claire par page", "Les mots de sa journée, du réveil au dodo"],
  },
  {
    slug: "3-4-ans",
    label: "3 à 4 ans",
    ageMin: 3,
    ageMax: 4,
    ageType: 4,
    intro:
      "L'âge des « pourquoi » et des premières grandes émotions. Une vraie petite histoire, avec un souci à " +
      "résoudre et une fin rassurante, dont votre enfant est le héros courageux.",
    besoins: ["Une intrigue simple avec une surprise", "Des émotions nommées : la peur, la joie, la fierté", "Un compagnon attachant"],
  },
  {
    slug: "5-6-ans",
    label: "5 à 6 ans",
    ageMin: 5,
    ageMax: 6,
    ageType: 6,
    intro:
      "Votre enfant suit maintenant de vraies aventures. Quêtes, alliés, petits défis à relever : le livre " +
      "l'aide aussi à traverser les grandes étapes, comme l'entrée à l'école.",
    besoins: ["Une quête avec des étapes", "Des dialogues vivants", "Un brin d'humour et de suspense"],
  },
  {
    slug: "7-8-ans",
    label: "7 à 8 ans",
    ageMin: 7,
    ageMax: 8,
    ageType: 8,
    intro:
      "Il commence à lire seul : place aux énigmes, aux enquêtes et aux grandes aventures, avec un vocabulaire " +
      "plus riche et des rebondissements qui donnent envie de tourner la page.",
    besoins: ["Des énigmes à résoudre", "Plus de texte, plus de rebondissements", "Des styles BD et manga"],
  },
  {
    slug: "9-12-ans",
    label: "9 à 12 ans",
    ageMin: 9,
    ageMax: 12,
    ageType: 10,
    intro:
      "Pour les lecteurs autonomes : mini-roman en chapitres ou enquête à résoudre, dont il est le héros, " +
      "avec ses amis ou sa famille comme personnages.",
    besoins: ["Des chapitres avec du suspense", "Un vocabulaire riche", "Des styles réalistes, manga ou BD"],
  },
];

export function findAgeGroup(slug: string): AgeGroup | undefined {
  return AGE_GROUPS.find((g) => g.slug === slug);
}
