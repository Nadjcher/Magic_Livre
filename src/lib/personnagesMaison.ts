/**
 * Les personnages « maison » : une vingtaine d'animaux et de créatures
 * fréquents dans les idées libres (dragon, fée, robot, renard…), dessinés une
 * fois par style et validés en les regardant en grand, comme les planches.
 *
 * Quand une histoire écrite par l'IA a besoin d'un dragon, l'autrice reçoit la
 * description du dragon maison (en français pour le texte, en anglais pour le
 * dessin), et le dessinateur reçoit sa fiche validée au lieu d'en inventer une
 * nouvelle. Le parent a toujours son histoire ; nous savons bien dessiner ses
 * personnages. Un personnage non validé n'est jamais utilisé : l'histoire
 * garde alors son propre personnage, comme avant.
 *
 * Stockage : la table des planches, sous l'histoire « personnages-maison ».
 */

import "server-only";
import type { Story } from "./storySchema";
import type { IllustrationStyle } from "./style_config";

export const HISTOIRE_MAISON = "personnages-maison";

export interface PersonnageMaison {
  id: string;
  /** Espèce telle que l'IA l'écrit en tête du visuel (« DRAGON: … »), plusieurs graphies possibles. */
  especes: string[];
  /** Pour l'autrice : à quoi il ressemble, en français (le texte doit concorder avec l'image). */
  francais: string;
  /** Pour le dessinateur, en anglais, espèce en majuscules en tête. */
  visuel: string;
}

export const PERSONNAGES_MAISON: PersonnageMaison[] = [
  { id: "dragon", especes: ["DRAGON", "BABY DRAGON"], francais: "un petit dragon vert menthe, tout rond, au ventre crème, aux petites ailes et aux joues roses", visuel: "DRAGON: a small round baby dragon the size of a cat, mint-green scales, cream belly, two small rounded wings, tiny horns, big friendly black eyes, pink cheeks; never scary" },
  { id: "fee", especes: ["FAIRY", "PIXIE"], francais: "une petite fée de la taille d'une main, robe de pétales verts, cheveux roux en chignon, ailes transparentes", visuel: "FAIRY: a tiny fairy the size of a hand, green petal dress, red hair in a bun, transparent dragonfly wings, a small glowing wand; a tiny person, not a child-sized girl" },
  { id: "robot", especes: ["ROBOT"], francais: "un petit robot bleu ciel, tout rond, avec une antenne terminée par une boule jaune et des yeux ronds lumineux", visuel: "ROBOT: a small round sky-blue robot the size of a toddler, rounded body, one antenna ending in a yellow ball, two round glowing eyes, short arms with three-finger hands; friendly, never scary" },
  { id: "licorne", especes: ["UNICORN"], francais: "une petite licorne blanche à la crinière pastel (rose, mauve, bleue) et à la corne dorée", visuel: "UNICORN: a small white unicorn foal, pastel mane and tail (pink, lilac, sky blue), a short golden spiral horn, big gentle eyes" },
  { id: "renard", especes: ["FOX"], francais: "un jeune renard roux au bout de la queue blanc et à l'écharpe verte", visuel: "FOX: a young red fox, white chest and white tail tip, black socks, a small green scarf; an animal on four legs" },
  { id: "lapin", especes: ["RABBIT", "BUNNY"], francais: "un lapin gris clair aux longues oreilles et au nez rose", visuel: "RABBIT: a real living light-grey rabbit, long upright ears, pink nose, white fluffy tail; an animal, not a plush toy" },
  { id: "ours", especes: ["BEAR", "BEAR CUB"], francais: "un ourson brun au museau crème", visuel: "BEAR: a real living brown bear cub, cream muzzle, round ears, on four legs; an animal, not a plush toy" },
  { id: "chat", especes: ["CAT", "KITTEN"], francais: "un chat tigré orange aux yeux verts", visuel: "CAT: an orange tabby cat, green eyes, white paws, long striped tail" },
  { id: "chien", especes: ["DOG", "PUPPY"], francais: "un chiot beige aux oreilles tombantes et au collier rouge", visuel: "DOG: a beige puppy with floppy ears, a black nose and a red collar" },
  { id: "hibou", especes: ["OWL"], francais: "un petit hibou brun aux grands yeux dorés et aux plumes du ventre crème", visuel: "OWL: a small brown owl, big golden eyes, cream belly feathers, small ear tufts" },
  { id: "souris", especes: ["MOUSE"], francais: "une petite souris grise aux grandes oreilles roses", visuel: "MOUSE: a tiny grey mouse, large round pink ears, long thin tail, whiskers" },
  { id: "herisson", especes: ["HEDGEHOG"], francais: "un petit hérisson brun au museau pointu", visuel: "HEDGEHOG: a small hedgehog with brown spines, a pale pointed face and a black button nose" },
  { id: "ecureuil", especes: ["SQUIRREL"], francais: "un écureuil roux à la grande queue en panache", visuel: "SQUIRREL: a red squirrel with a big bushy tail, tufted ears and a cream belly" },
  { id: "tortue", especes: ["TURTLE", "TORTOISE"], francais: "une petite tortue verte à la carapace brune", visuel: "TORTOISE: a small green tortoise with a domed brown shell with lighter patches" },
  { id: "dauphin", especes: ["DOLPHIN"], francais: "un dauphin gris-bleu au sourire doux", visuel: "DOLPHIN: a blue-grey dolphin with a pale belly and a gentle smile; in water" },
  { id: "pingouin", especes: ["PENGUIN"], francais: "un petit manchot noir et blanc au bec orange", visuel: "PENGUIN: a small black-and-white penguin with an orange beak and orange feet" },
  { id: "dinosaure", especes: ["DINOSAUR", "BABY DINOSAUR"], francais: "un bébé dinosaure orange aux taches jaunes, tout rond", visuel: "DINOSAUR: a round baby dinosaur the size of a dog, orange skin with yellow spots, small spikes along the back, big friendly eyes; never scary" },
  { id: "lutin", especes: ["ELF", "GNOME", "GOBLIN"], francais: "un petit lutin haut comme une botte, bonnet rouge pointu et barbe blanche", visuel: "GNOME: a tiny gnome as tall as a boot, pointed red hat, white beard, blue tunic, brown boots; a tiny person" },
  { id: "baleine", especes: ["WHALE"], francais: "une grande baleine bleue au ventre rayé clair", visuel: "WHALE: a big gentle blue whale with a pale striped throat; in the sea" },
  { id: "coccinelle", especes: ["LADYBUG", "LADYBIRD"], francais: "une coccinelle rouge à points noirs, de la taille d'un pouce", visuel: "LADYBUG: a red ladybug with black spots, the size of a thumb" },
];

/** L'espèce écrite en tête d'un visuel (« BABY DRAGON: … » → « BABY DRAGON »). */
function especeDe(visuel: string): string {
  return (/^\s*([A-Z][A-Z' -]+?)\s*:/.exec(visuel)?.[1] ?? "").trim();
}

/** Le personnage maison qui correspond à un visuel, s'il y en a un. */
export function correspondance(visuel: string): PersonnageMaison | undefined {
  const e = especeDe(visuel);
  if (!e || /PLUSH|TOY|HUMAN/.test(e)) return undefined; // jamais un doudou ni un humain
  const mots = e.split(/\s+/);
  return PERSONNAGES_MAISON.find((p) => p.especes.some((x) => x === e || mots.includes(x)));
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** Le visuel de l'histoire reprend celui de la maison (au moins son début, mot pour mot). */
export function recopie(visuel: string, maison: string): boolean {
  return norm(visuel).startsWith(norm(maison).slice(0, 60));
}

/** Les personnages maison validés pour ce style : id → url de la fiche. */
export async function maisonValides(style: string): Promise<Map<string, string>> {
  const { lirePlanches } = await import("./planches");
  const m = await lirePlanches(HISTOIRE_MAISON, style);
  return new Map([...m].filter(([, l]) => l.valide).map(([id, l]) => [id, l.url]));
}

/** Pour l'autrice : les personnages maison disponibles dans ce style ("" s'il n'y en a pas). */
export async function blocMaison(style: string): Promise<string> {
  const valides = await maisonValides(style).catch(() => new Map<string, string>());
  const liste = PERSONNAGES_MAISON.filter((p) => valides.has(p.id));
  if (!liste.length) return "";
  return [
    "PERSONNAGES DE LA MAISON (déjà dessinés et validés : à préférer quand l'histoire a besoin de l'un d'eux) :",
    ...liste.map((p) => `- ${p.francais}. Visuel à recopier MOT POUR MOT dans "cast" : ${p.visuel}`),
    "Tu leur donnes le nom que tu veux. Dans le texte, garde exactement leurs couleurs et leur allure. Un seul personnage de chaque espèce. N'en ajoute pas s'ils ne servent pas l'histoire.",
  ].join("\n");
}

/**
 * Les personnages de l'histoire qui ONT CHOISI un personnage maison validé
 * (visuel recopié) : ils sont reliés à sa fiche. Un dragon rouge demandé par le
 * parent n'est pas le dragon maison : il garde son propre dessin.
 */
export async function harmoniserCast(story: Story, style: IllustrationStyle | string): Promise<Story> {
  if (!story.cast?.length) return story;
  const valides = await maisonValides(style).catch(() => new Map<string, string>());
  if (!valides.size) return story;
  const vus = new Set<string>();
  const cast = story.cast.map((c) => {
    const p = correspondance(c.visuel);
    if (!p || !valides.has(p.id) || vus.has(p.id) || !recopie(c.visuel, p.visuel)) return c;
    vus.add(p.id);
    return { ...c, visuel: p.visuel, maison: p.id };
  });
  return { ...story, cast };
}

/** L'atelier : chaque personnage maison, sa fiche et son état. */
export async function etatMaison(style: string) {
  const { lirePlanches } = await import("./planches");
  const m = await lirePlanches(HISTOIRE_MAISON, style);
  const liste = PERSONNAGES_MAISON.map((p) => ({ ...p, url: m.get(p.id)?.url ?? null, valide: Boolean(m.get(p.id)?.valide) }));
  return { liste, dessines: liste.filter((p) => p.url).length, valides: liste.filter((p) => p.valide).length, total: liste.length };
}

/**
 * Dessine les fiches maison manquantes (payant : environ 0,05 $ chacune), non
 * validées : elles ne servent aux livres qu'une fois regardées et validées.
 */
export async function dessinerMaison(style: IllustrationStyle, limite: number): Promise<{ dessines: number; erreurs: string[] }> {
  const { lirePlanches, enregistrer } = await import("./planches");
  const { generateIllustration } = await import("./illustration");
  const { mapLimit } = await import("./parallele");
  const existants = await lirePlanches(HISTOIRE_MAISON, style);
  const erreurs: string[] = [];
  let dessines = 0;
  await mapLimit(
    PERSONNAGES_MAISON.filter((p) => !existants.has(p.id)),
    4,
    async (p, k) => {
      if (Date.now() > limite) return;
      const r = await generateIllustration({
        style,
        scene:
          `Character model sheet: ${p.visuel}. Full body, front view, alone, friendly relaxed pose, plain soft light background, ` +
          "nothing else, no text or letters. The species must be unmistakable at first glance.",
        seed: 70_000 + k,
      });
      if (r.imageUrl) {
        await enregistrer(HISTOIRE_MAISON, style, p.id, r.imageUrl);
        dessines++;
      } else erreurs.push(`${p.id} : ${r.error ?? "échec"}`);
    },
  );
  return { dessines, erreurs };
}
