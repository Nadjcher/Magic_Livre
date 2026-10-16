/**
 * Liste des noms de personnages et de marques protégés par le droit d'auteur
 * ou des marques déposées.
 *
 * Règle non négociable : si une saisie utilisateur contient l'un de ces noms,
 * la création est refusée poliment et un héros original est proposé. L'application
 * ne génère JAMAIS de personnage sous droits, même reformulé.
 *
 * La détection se fait sur des mots entiers, insensible à la casse et aux
 * accents, pour éviter les faux positifs (ex : « simba » dans un autre mot).
 */

/** Noms protégés (univers Disney, Pixar, Marvel, DC, Nintendo, Pokémon, etc.). */
export const PROTECTED_NAMES: readonly string[] = [
  // Disney / Pixar
  "mickey",
  "minnie",
  "donald",
  "dingo",
  "pluto",
  "elsa",
  "anna",
  "olaf",
  "la reine des neiges",
  "frozen",
  "simba",
  "le roi lion",
  "aladdin",
  "jasmine",
  "ariel",
  "la petite sirene",
  "cendrillon",
  "blanche neige",
  "raiponce",
  "vaiana",
  "moana",
  "buzz l'eclair",
  "buzz leclair",
  "woody",
  "toy story",
  "nemo",
  "dory",
  "wall-e",
  "ratatouille",
  "les indestructibles",
  "cars",
  "flash mcqueen",
  "vice-versa",
  "encanto",
  "mirabel",
  "stitch",
  "lilo",
  "mulan",
  "pocahontas",
  "peter pan",
  "clochette",
  "winnie l'ourson",
  "winnie",
  "tigrou",
  "bourriquet",

  // Marvel
  "spider-man",
  "spiderman",
  "iron man",
  "captain america",
  "hulk",
  "thor",
  "black panther",
  "les avengers",
  "avengers",
  "groot",
  "deadpool",
  "wolverine",

  // DC
  "batman",
  "superman",
  "wonder woman",
  "flash",
  "aquaman",
  "joker",

  // Nintendo
  "mario",
  "luigi",
  "peach",
  "bowser",
  "yoshi",
  "toad",
  "donkey kong",
  "zelda",
  "link",
  "kirby",

  // Pokémon
  "pokemon",
  "pikachu",
  "pokémon",
  "dracaufeu",
  "salameche",
  "bulbizarre",
  "carapuce",
  "evoli",

  // Autres univers populaires sous droits
  "harry potter",
  "hermione",
  "poudlard",
  "dumbledore",
  "voldemort",
  "star wars",
  "dark vador",
  "darth vader",
  "yoda",
  "jedi",
  "bob l'eponge",
  "bob leponge",
  "patrick etoile",
  "la pat patrouille",
  "pat patrouille",
  "paw patrol",
  "chase",
  "marcus",
  "peppa pig",
  "peppa",
  "les minions",
  "minion",
  "shrek",
  "hello kitty",
  "barbie",
  "tortues ninja",
  "pat'patrouille",
  "pyjamasques",
  "gluglu",
  "bibou",
  "yoyo",
  "sonic",
  "pacman",
  "pac-man",
  "angry birds",
  "fortnite",
  "minecraft",
  "roblox",
  "goku",
  "naruto",
  "pikachu",
  "doraemon",
  "sailor moon",
  "totoro",
  "dragon ball",
];

/**
 * Normalise une chaîne : minuscules, sans accents, espaces réduits.
 * Exporté pour les tests.
 */
export function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    // Supprime les diacritiques (accents).
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Détecte la présence d'un nom protégé dans un texte.
 * Renvoie la liste des noms protégés trouvés (vide si aucun).
 *
 * Le rapprochement se fait sur des limites de mots afin d'éviter les faux
 * positifs. Les noms composés (plusieurs mots) sont recherchés tels quels.
 */
export function findProtectedNames(input: string): string[] {
  const haystack = normalizeForMatch(input);
  const found = new Set<string>();

  for (const rawName of PROTECTED_NAMES) {
    const name = normalizeForMatch(rawName);
    if (name.length === 0) continue;

    // Construit une expression régulière avec limites de mots.
    // On échappe les caractères spéciaux du nom.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, "u");
    if (pattern.test(` ${haystack} `)) {
      found.add(rawName);
    }
  }

  return Array.from(found);
}

/** Indique si un texte contient au moins un nom protégé. */
export function containsProtectedName(input: string): boolean {
  return findProtectedNames(input).length > 0;
}
