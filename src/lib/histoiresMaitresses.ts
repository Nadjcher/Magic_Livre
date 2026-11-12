/**
 * Histoires maîtresses : des histoires écrites, relues et validées une fois pour
 * toutes. Le site ne les réécrit pas : il remplace le prénom, le doudou et les
 * accords, et remplit seulement 2 ou 3 passages PRÉVUS où un détail de l'enfant
 * sert l'intrigue. Tout le reste est garanti mot pour mot (vérifié par le code).
 *
 * Marqueurs dans le texte :
 *   {prenom}            prénom de l'enfant
 *   {de_prenom}         « de Kamil » ou « d'Inès » (élision)
 *   {Il} {il}           « Elle/Il », « elle/il » selon l'enfant
 *   {doudou}            nom du doudou (« Pompon »), ou « son lapin » s'il n'a pas de nom
 *   {son_doudou} {doudou}  « son lapin Pompon », ou « son lapin » sans nom, « son doudou » sans doudou
 *   {parent}            « Papa », « Maman », « Mamie » ou « Papi »
 *   {dit_parent}        « dit-il » / « dit-elle »
 *   {petit_parent}      « petit » / « petite »
 *   [[cle]]             passage personnalisé (voir `passages`), sinon texte par défaut
 */

export interface PassagePerso {
  /** Ce que le passage doit faire dans l'intrigue (consigne pour l'IA). */
  consigne: string;
  /** Texte utilisé si rien de mieux (ou si l'IA échoue). */
  defaut: string;
  /** Longueur maximale, en mots. */
  motsMax: number;
}

export interface HistoireMaitresse {
  id: string;
  themeId: string;
  ageMin: number;
  ageMax: number;
  titre: string;
  resume: string;
  ritournelle: string;
  /** Tenue fixe du héros et fiches des personnages (anglais, pour les images). */
  tenueHeros: string;
  cast: { nom: string; visuel: string }[];
  couverture: string;
  pages: { texte: string; scene: string; presents?: string[] }[];
  passages: Record<string, PassagePerso>;
  faits: string;
}

const TENUE = "soft yellow pyjamas with small orange moons, felt slippers";

export const HISTOIRES_MAITRESSES: HistoireMaitresse[] = [
  {
    id: "maitresse-petit-poucet",
    themeId: "petit-poucet",
    // Passé simple, ton du conte : à partir de 4 ans.
    ageMin: 4,
    ageMax: 8,
    titre: "Les cailloux tordus {de_prenom}",
    ritournelle: "« Petit caillou blanc, montre-nous le chemin. »",
    resume:
      "Ce soir, {parent} ouvre le vieux livre de contes de son enfance. Mais à la page du Petit Poucet, les cailloux blancs ont disparu ! Avec un crayon blanc et {doudou}, {prenom} entre dans la forêt du livre pour ramener Poucet et ses frères à la maison.",
    faits:
      "Ce que {prenom} dessine au crayon blanc dans le livre de {parent} devient vrai, et rien n'apparaît tout seul. Le géant n'a jamais été vu, seulement entendu ronfler. Poucet garde dans sa poche un caillou dessiné par {prenom}.",
    tenueHeros: TENUE,
    cast: [
      {
        nom: "Poucet",
        visuel:
          "HUMAN BOY: a tiny cheerful fairy-tale boy the size of a toy figurine, about 25 cm tall (his whole body fits between the ground and the hero's knee; even next to the crouching hero his bonnet stays below the hero's chest; ALWAYS this size; next to the hero he stands on a mushroom, a stone or a leaf), clearly a little boy (boy's face, short straight black hair above the ears, no fringe over the eyes), red knitted bonnet, brown wool jacket, grey trousers with neat patches (never ripped), little wooden clogs; never looks like the hero.",
      },
    ],
    couverture:
      "Book cover, medium shot: {prenom} and Poucet seen from behind walking hand in hand along a path of crooked glowing white stones of unequal sizes into a soft storybook forest; {prenom} holds {doudou} under one arm and a white pencil in the other hand; warm golden light at the end of the path; calm dark-blue sky with stars in the upper third.",
    pages: [
      {
        texte:
          "Ce soir-là, {parent} sortit de l'étagère un très vieux livre. Personne ne l'avait ouvert depuis très longtemps. Sa couverture était douce, comme un chausson d'hiver. « C'était mon livre de contes quand j'étais {petit_parent} », {dit_parent}. {prenom} se blottit sous la couette avec {son_doudou} {doudou}. {parent} ouvrit le livre à l'histoire du Petit Poucet.",
        scene:
          "A cosy child's bedroom at night lit by a warm bedside lamp: {prenom} sits in bed under the duvet hugging {doudou}; {parent} (seen from behind, face not shown) sits on the edge of the bed opening a worn old storybook with a soft faded cover; a white pencil lies on the bedside table.",
        presents: ["{parent}"],
      },
      {
        texte:
          "À la page de la forêt, {prenom} fronça les sourcils. Poucet et ses frères s'étaient perdus en ramassant du bois. Mais le chemin de cailloux blancs avait disparu de l'image ! « Sans cailloux, ils ne pourront jamais rentrer chez eux », chuchota {prenom}. {Il} serra {doudou} très fort.",
        scene:
          "In the lamp-lit bedroom, {prenom} leans over the open old storybook on the duvet with a worried frown, squeezing {doudou}; the open page shows a forest with a bare path and no white stones (no letters on the page); warm golden lamplight.",
      },
      {
        texte:
          "{parent} descendit à la cuisine chercher un verre d'eau. Sur la page, un seul caillou blanc luisait encore, minuscule. {prenom} attrapa le crayon blanc posé sur sa table de nuit. Du bout du doigt, {il} toucha la petite lueur. Hop ! {prenom} glissa dans la forêt du livre, {doudou} sous le bras. Le caillou brillait au creux de sa main.",
        scene:
          "Close-up of the open old storybook on the duvet: on the forest page one single tiny white stone glows softly; {prenom}'s small hand reaches down to touch the glow while the other hand holds a white pencil; {doudou} peeks at the edge; a gentle light rises from the page in the dim room.",
      },
      {
        texte:
          "Dans le livre, les arbres sentaient l'encre, et la mousse le vieux papier. Un garçon haut comme une botte fouillait sous les fougères : Poucet ! « Mes cailloux se sont effacés, je ne sais pas pourquoi. — Je peux t'aider, dit {prenom}. — Pas besoin, je trouve toujours le chemin. » Au loin, le géant ronflait, et le bord de la page s'assombrit.",
        scene:
          "Inside a soft storybook forest: {prenom}, holding {doudou} and a white pencil, offers help to Poucet, who searches under the ferns with his chin raised proudly; in the background his six little brothers (same tiny size, plain clothes, no bonnets) wait huddled together against a tree trunk; the edges of the scene slightly darker, the leaves trembling as if from a distant snore.",
        presents: ["Poucet"],
      },
      {
        texte:
          "Poucet sortit un bout de pain de sa poche. Il sema des miettes en chantonnant : « Petit caillou blanc, montre-nous le chemin. » Trois merles gourmands se faufilèrent et picorèrent jusqu'à la dernière miette. Le bord de la page devint plus sombre. Poucet haussa les épaules, mais son menton tremblait un peu. Sans rien dire, {prenom} lui tendit {doudou}. Poucet serra {doudou} contre lui, juste un petit peu.",
        scene:
          "In the storybook forest, three cheeky blackbirds peck up the last breadcrumbs on the path; Poucet, chin trembling, holds {doudou} that {prenom} has just handed to him; {prenom} watches kindly; the edges of the scene grow darker.",
        presents: ["Poucet"],
      },
      {
        texte:
          "{prenom} ouvrit la main et posa son caillou par terre. Il brilla, [[comparaison]]. « Petit caillou blanc, montre-nous le chemin », murmura {prenom}. Mais un seul caillou ne faisait pas un chemin. Le ronflement s'arrêta net, et {prenom} retint son souffle. Puis le géant se remit à ronfler. Ouf !",
        scene:
          "On the dim forest path, {prenom} kneels to place one small glowing white stone on the ground, holding their breath with wide eyes; Poucet stands beside, listening, still holding {doudou}; a single pool of white light around the lonely stone, dark edges all around.",
        presents: ["Poucet"],
      },
      {
        texte:
          "{prenom} regarda son crayon blanc, puis le sol de papier. {Il} s'accroupit et, la langue entre les dents, dessina un caillou. [[forme]] Le trait frémit, se gonfla… et le dessin devint un vrai caillou ! Poucet éclata de rire, pour la première fois. Puis il rendit {doudou}, tortilla son bonnet et demanda tout bas : « Tu m'en dessines un autre ? »",
        scene:
          "In the storybook forest, {prenom} crouches and draws a crooked white stone on the ground with a white pencil; the freshly drawn stone puffs up and glows; Poucet leans over, laughing for the first time and twisting his red bonnet shyly; {doudou} sits beside {prenom}.",
        presents: ["Poucet"],
      },
      {
        texte:
          "{prenom} dessina, et Poucet montra où aller. « Par là, après la souche ! Ici, près du ruisseau ! » Les cailloux étaient un peu tordus, mais ils brillaient tous. Alors {prenom} et Poucet dirent ensemble : « Petit caillou blanc, montre-nous le chemin. » Et le chemin s'allongea entre les arbres, caillou après caillou.",
        scene:
          "Seen from behind, {prenom} with {doudou} under one arm walks beside Poucet along a winding path of slightly crooked glowing white stones of unequal sizes that stretches into the storybook forest, past a tree stump and a little stream; hopeful warm glow.",
        presents: ["Poucet"],
      },
      {
        texte:
          "Au bout du chemin tordu, une petite maison avait sa fenêtre allumée. Les frères de Poucet coururent vers la porte en riant. Poucet glissa un caillou dessiné dans sa poche. « Merci, {prenom} », dit-il. Tout autour, la page redevint claire.",
        scene:
          "At the end of the crooked glowing stone path, a small cottage with a warmly lit window stands in a forest turning bright again; Poucet's six tiny brothers run laughing toward the door; Poucet slips a white stone into his pocket with rosy cheeks, smiling at {prenom}, who stands proudly holding {doudou} and the white pencil; soft golden light.",
        presents: ["Poucet"],
      },
      {
        texte:
          "{prenom} était de nouveau dans son lit, {doudou} contre sa joue. {Il} reposa le crayon blanc sur sa table de nuit. {parent} revint et regarda la page : les cailloux étaient là, un peu tordus. « Ils sont encore plus beaux qu'avant », {dit_parent} doucement. À la page suivante, une botte dépassait d'un buisson. {prenom} sourit et ferma les yeux.",
        scene:
          "The old storybook lies open on the duvet showing the forest with a path of slightly crooked glowing white stones; {parent}'s hand rests gently on the page near the corner where the next page shows a large boot sticking out of a bush; {prenom} drifts to sleep against the pillow with {doudou} against their cheek; the white pencil back on the bedside table; soft lamplight.",
        presents: ["{parent}"],
      },
    ],
    passages: {
      comparaison: {
        consigne:
          "Comparer le caillou qui brille à un objet rond et familier du monde de l'enfant (tiré de ce qu'il aime, de son doudou ou de son quotidien). Commence par « rond comme » ou « doux comme ».",
        defaut: "rond comme une bille de la cour de récré",
        motsMax: 10,
      },
      forme: {
        consigne:
          "Une seule phrase : le caillou dessiné sort un peu tordu, avec une forme qui ressemble à quelque chose que l'enfant aime ou à un détail de son doudou (une oreille, une queue ronde…). C'est drôle et tendre, et c'est pour ça que Poucet rit. Commence par « Il sortit ».",
        defaut: "Il sortit tout cabossé, comme une patate.",
        motsMax: 18,
      },
    },
  },
];

/** L'histoire maîtresse d'un thème, si elle existe pour cet âge. */
export function maitressePour(themeId: string | undefined, age: number): HistoireMaitresse | null {
  if (!themeId) return null;
  return HISTOIRES_MAITRESSES.find((h) => h.themeId === themeId && age >= h.ageMin && age <= h.ageMax) ?? null;
}

export interface Personnalisation {
  prenom: string;
  fille: boolean;
  /** Nom propre du doudou ; vide s'il n'en a pas (on dit alors « son lapin »). */
  doudou: string;
  /** « son lapin », « sa girafe », « son doudou ». */
  sonDoudou: string;
  /** Apparence du doudou pour les images (anglais). */
  doudouVisuel: string;
  parent: "Papa" | "Maman" | "Mamie" | "Papi";
  passages: Record<string, string>;
}

/** Remplace les marqueurs d'un texte (les passages [[…]] compris). */
export function remplir(texte: string, p: Personnalisation, h: HistoireMaitresse): string {
  const feminin = p.parent === "Maman" || p.parent === "Mamie";
  const nomme = p.doudou.trim();
  const de = /^[aeiouyhàâäéèêëîïôöûùü]/i.test(p.prenom.trim()) ? "d'" : "de ";
  return texte
    .replace(/\[\[(\w+)\]\]/g, (_, cle: string) => p.passages[cle] ?? h.passages[cle]?.defaut ?? "")
    .replaceAll("{de_prenom}", `${de}${p.prenom}`)
    .replaceAll("{prenom}", p.prenom)
    .replaceAll("{Il}", p.fille ? "Elle" : "Il")
    .replaceAll("{il}", p.fille ? "elle" : "il")
    // Doudou sans nom : « son lapin » partout (et « son doudou » si l'enfant n'en a pas décrit).
    .replaceAll("{son_doudou} {doudou}", nomme ? `${p.sonDoudou} ${nomme}` : p.sonDoudou)
    .replaceAll("{son_doudou}", p.sonDoudou)
    .replaceAll("{doudou}", nomme || p.sonDoudou)
    .replaceAll("{parent}", p.parent)
    .replaceAll("{dit_parent}", feminin ? "dit-elle" : "dit-il")
    .replaceAll("{petit_parent}", feminin ? "petite" : "petit");
}

/** « son lapin », « sa girafe », mais « son amie » devant une voyelle ou un h muet. */
export function possessif(son: string): string {
  const m = /^(son|sa)\s+(.+)$/i.exec(son.trim());
  if (!m) return "son doudou";
  const reste = m[2]!.toLowerCase();
  return `${/^[aeiouyhàâäéèêëîïôöûù]/i.test(reste) ? "son" : m[1]!.toLowerCase()} ${reste}`;
}

/** Mots (pour la limite des passages personnalisés). */
const mots = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/**
 * Vérifie un passage proposé par l'IA : longueur, une seule phrase, rien
 * d'interdit (consignes d'image, chiffres, guillemets qui casseraient le texte).
 */
export function passageValide(cle: string, texte: string, h: HistoireMaitresse): boolean {
  const def = h.passages[cle];
  if (!def) return false;
  const t = texte.trim();
  if (!t || mots(t) > def.motsMax) return false;
  if (/[«»"{}[\]\n]|\d|bouche|sourire|visage|illustration|image/i.test(t)) return false;
  // Une majuscule après le premier mot = un nom propre (marque, personnage connu, dessin animé) : refusé.
  if (/\s\p{Lu}/u.test(t) || /[®™]/.test(t)) return false;
  // Même début que le texte par défaut (« rond comme », « Il sortit »…) : la phrase s'insère sans couture.
  const debut = def.defaut.split(/\s+/).slice(0, 2).join(" ").toLowerCase();
  const debutAlt = cle === "comparaison" ? ["rond comme", "doux comme", "ronde comme"] : [debut];
  return debutAlt.some((d) => t.toLowerCase().startsWith(d)) || t.toLowerCase().startsWith(debut);
}
