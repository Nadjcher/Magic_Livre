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
  /** false : branchée mais pas encore proposée (images pas encore testées) ; les administrateurs peuvent l'essayer. */
  ouverte?: boolean;
  /** Série « Le vieux livre de contes » : numéro d'épisode et objet que l'enfant rapporte (page « ma collection »). */
  episode?: number;
  objet?: string;
}

const TENUE = "soft yellow pyjamas with small orange moons, felt slippers";

export const HISTOIRES_MAITRESSES: HistoireMaitresse[] = [
  {
    id: "maitresse-petit-poucet",
    episode: 1,
    // L'enfant ne rapporte rien du conte : la collection commence par le crayon blanc.
    objet: "le crayon blanc",
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
      "Book cover, medium shot: {prenom} and Poucet seen from behind walking hand in hand along a trail of separate small crooked glowing white pebbles of unequal sizes, spaced apart with grass between them (never a paved path, never stepping stones) into a soft storybook forest; {prenom} holds {doudou} under one arm and a white pencil in the other hand; warm golden light at the end of the path; calm dark-blue sky with stars in the upper third.",
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
          "Seen from behind, {prenom} with {doudou} under one arm walks beside Poucet along a trail of separate small crooked glowing white pebbles of unequal sizes, spaced apart with grass between them (never a paved path, never stepping stones) winding into the storybook forest, past a tree stump and a little stream; hopeful warm glow.",
        presents: ["Poucet"],
      },
      {
        texte:
          "Au bout du chemin tordu, une petite maison avait sa fenêtre allumée. Les frères de Poucet coururent vers la porte en riant. Poucet glissa un caillou dessiné dans sa poche. « Merci, {prenom} », dit-il. Tout autour, la page redevint claire.",
        scene:
          "At the end of a trail of separate small crooked glowing white pebbles of unequal sizes, spaced apart with grass between them (never a paved path, never stepping stones), a small cottage with a warmly lit window stands in a forest turning bright again; Poucet's six tiny brothers run laughing toward the door; Poucet slips a white stone into his pocket with rosy cheeks, smiling at {prenom}, who stands proudly holding {doudou} and the white pencil; soft golden light.",
        presents: ["Poucet"],
      },
      {
        texte:
          "{prenom} était de nouveau dans son lit, {doudou} contre sa joue. {Il} reposa le crayon blanc sur sa table de nuit. {parent} revint et regarda la page : les cailloux étaient là, un peu tordus. « Ils sont encore plus beaux qu'avant », {dit_parent} doucement. À la page suivante, une botte dépassait d'un buisson. {prenom} sourit et ferma les yeux.",
        scene:
          "The old storybook lies open on the duvet showing the forest with a trail of separate small crooked glowing white pebbles of unequal sizes, spaced apart with grass between them (never a paved path, never stepping stones); {parent}'s hand rests gently on the page near the corner where the next page shows a large boot sticking out of a bush; {prenom} drifts to sleep against the pillow with {doudou} against their cheek; the white pencil back on the bedside table; soft lamplight.",
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
  {
    id: "maitresse-lutins-cordonnier",
    themeId: "noel",
    episode: 2,
    objet: "un bout de ruban doré",
    // Branchée, pas encore proposée : les lutins doivent d'abord passer le test d'images.
    ouverte: false,
    ageMin: 4,
    ageMax: 8,
    titre: "Le fil d'or {de_prenom}",
    ritournelle: "« Petit fil, petit fil, couds jusqu'au matin. »",
    resume:
      "Dans le vieux livre de contes de {parent}, c'est la veille de Noël, et les lutins du cordonnier n'ont plus un seul brin de fil d'or ! Avec son crayon blanc et {doudou}, {prenom} entre dans l'atelier pour que les souliers soient prêts avant le matin.",
    faits:
      "Ce que {prenom} dessine au crayon blanc dans le livre de {parent} devient vrai. Les lutins Bobine, Poinçon et Dé ont cousu les souliers avec le fil d'or tordu de {prenom}, et réparé une botte immense dont on ne sait pas à qui elle appartient. {prenom} a rapporté un bout de ruban doré.",
    tenueHeros: TENUE,
    cast: [
      {
        nom: "Bobine",
        visuel:
          "TINY ELF the size of a teacup (ALWAYS this size, standing on the workbench or on a spool), a chatty elf girl with round rosy cheeks, auburn braid, a pointed GREEN felt hat, a patched apron with a tape measure; never looks like the hero.",
      },
      {
        nom: "Poinçon",
        visuel:
          "TINY ELF the size of a teacup (ALWAYS this size), a grumpy little elf with a short white beard, bushy eyebrows, a pointed RED felt hat, a brown leather apron, holding a tiny awl; never looks like the hero.",
      },
      {
        nom: "Dé",
        visuel:
          "TINY ELF the size of an egg cup, the smallest of the three (ALWAYS this size), a shy chilly little elf with big round ears, a long knitted BROWN hat that falls over one eye, a striped scarf, a silver thimble at his belt; never looks like the hero.",
      },
    ],
    couverture:
      "Book cover, medium shot: in a cosy old shoemaker's workshop at night with snow outside the window, {prenom} sits on the workbench drawing a tangled glowing golden thread around an empty wooden spool with a white pencil; the three tiny elves Bobine, Poinçon and Dé (each the size of a teacup) gather around, delighted; {doudou} sits beside {prenom}; warm golden light from the thread; calm dark-blue night sky through the window in the upper third.",
    pages: [
      {
        texte:
          "Sur l'étagère, {parent} prit le vieux livre de contes, celui à la couverture douce comme un chausson d'hiver. {prenom} se blottit sous la couette avec {son_doudou} {doudou}. {parent} ouvrit le livre à une histoire toute nouvelle : « Les lutins et le cordonnier ».",
        scene:
          "A cosy child's bedroom at night lit by a warm bedside lamp: {prenom} snuggles under the duvet hugging {doudou}; {parent} (seen from behind, face not shown) sits on the edge of the bed opening a worn old storybook with a soft faded cover; a white pencil lies on the bedside table.",
        presents: ["{parent}"],
      },
      {
        texte:
          "Sur l'image, un vieil atelier dormait sous la neige. Trois lutins étaient assis au bord de l'établi, les épaules basses. Leur bobine était vide : plus un seul brin de fil d'or ! « Sans fil, les souliers ne seront jamais prêts pour Noël », chuchota {prenom}. {Il} cacha son nez dans {doudou}.",
        scene:
          "In the lamp-lit bedroom, {prenom} leans over the open old storybook, hiding their nose in {doudou}; the open page shows an old snowy shoemaker's workshop where three tiny elves sit sadly on the edge of a workbench next to an empty wooden spool (no letters on the page).",
      },
      {
        texte:
          "{parent} partit chercher une couverture de plus. Sur la page, un dernier brin d'or brillait encore, tout au fond de la bobine. {prenom} prit le crayon blanc posé sur sa table de nuit et toucha la petite lueur. Hop ! {prenom} se retrouva dans l'atelier, {doudou} sous le bras. Ça sentait le cuir et le pain d'épices.",
        scene:
          "Close-up of the open storybook on the duvet: at the bottom of an empty wooden spool on the page, one last golden thread glows softly; {prenom}'s small hand touches the glow with a white pencil; {doudou} peeks at the edge; a gentle golden light rises from the page in the dim room.",
      },
      {
        texte:
          "Les lutins n'étaient pas plus hauts qu'une tasse. Bobine parlait sans s'arrêter, Poinçon fronçait les sourcils, et Dé, le plus petit, grelottait sous son bonnet. Sur l'établi trônait une botte immense, trouée au talon. « Elle est à qui ? demanda {prenom}. — Secret de lutin ! » dit Bobine. Puis les trois lutins chantèrent tout bas : « Petit fil, petit fil, couds jusqu'au matin. »",
        scene:
          "Inside a cosy old shoemaker's workshop at night, warm candle light: {prenom}, holding {doudou}, meets the three tiny elves on the workbench (Bobine chatting, Poinçon frowning, little Dé shivering under his long brown hat); behind them stands an enormous worn leather boot, much taller than {prenom}, with a hole in the heel.",
        presents: ["Bobine", "Poinçon", "Dé"],
      },
      {
        texte:
          "Poinçon attrapa un fil d'araignée accroché à la fenêtre. Il l'enfila dans son aiguille… Clac ! Le fil cassa au premier point. Poinçon grogna dans sa barbe. Dans son coin, Dé claquait des dents. Sans rien dire, {prenom} lui tendit {doudou}. Dé s'y blottit tout entier, et seul son bonnet dépassait.",
        scene:
          "On the workbench by the frosty window: grumpy Poinçon holds a needle with a snapped spider-web thread; little Dé is snuggled entirely into {doudou}, only his long brown hat sticking out; {prenom} watches kindly; Bobine throws up her hands.",
        presents: ["Bobine", "Poinçon", "Dé"],
      },
      {
        texte:
          "{prenom} trouva un brin de laine rouge sous l'établi. « Et avec ça ? » Bobine l'essaya : la laine était douce, mais bien trop courte. Elle ne fit qu'un seul point. « Petit fil, petit fil, couds jusqu'au matin », murmura {prenom}. Dehors, la neige tombait de plus en plus fort, et la nuit avançait.",
        scene:
          "In the workshop, {prenom} holds out a short strand of red wool to Bobine, who has made only one single stitch on a small shoe; snow falls thickly outside the dark window; Poinçon and little Dé (still wrapped in {doudou}) look on; a single candle lights {prenom}'s face.",
        presents: ["Bobine", "Poinçon", "Dé"],
      },
      {
        texte:
          "{prenom} regarda son crayon blanc, puis la bobine vide. {Il} s'assit sur l'établi et dessina un fil, un long fil qui faisait le tour de la bobine. [[forme]] Le trait frémit, se mit à briller… et devint un vrai fil d'or ! Les lutins éclatèrent de rire. Dé, tout réchauffé, rendit {doudou} à {prenom}.",
        scene:
          "{prenom} sits on the workbench drawing with a white pencil a long tangled white line around the empty wooden spool; the drawn thread starts to glow and turns into real golden thread, lighting {prenom}'s face; the three tiny elves burst out laughing; little Dé hands {doudou} back to {prenom}.",
        presents: ["Bobine", "Poinçon", "Dé"],
      },
      {
        texte:
          "Le fil était tordu, mais il cousait à merveille. Bobine taillait, Poinçon piquait, Dé tirait l'aiguille. {prenom} dessinait du fil dès que la bobine se vidait. Tous ensemble, ils chantèrent : « Petit fil, petit fil, couds jusqu'au matin. » Il y eut des souliers rouges, des bottines fourrées, et [[cadeau]].",
        scene:
          "A busy joyful night in the workshop: Bobine cuts leather, Poinçon stitches, little Dé pulls a needle with crooked golden thread, {prenom} draws more thread; finished little shoes pile up: red shoes, fur-lined boots and a tiny pair of slippers; {doudou} sits on the bench; warm golden glow from the thread.",
        presents: ["Bobine", "Poinçon", "Dé"],
      },
      {
        texte:
          "Au matin, les souliers étaient alignés sur l'établi, prêts à être offerts. La botte immense avait un talon tout neuf, cousu de fil d'or un peu tordu. Bobine noua un bout de ruban doré autour du poignet {de_prenom}. « Pour que tu te souviennes de nous. » Tout autour, l'atelier se mit à briller.",
        scene:
          "Early morning light in the workshop: a neat row of finished shoes on the workbench ready to be given; the enormous boot now has a new heel sewn with slightly crooked golden thread; Bobine ties a golden ribbon around {prenom}'s wrist; Poinçon smiles at last and little Dé waves; {doudou} under {prenom}'s arm.",
        presents: ["Bobine", "Poinçon", "Dé"],
      },
      {
        texte:
          "{prenom} était de nouveau dans son lit, {doudou} contre sa joue et le ruban doré au poignet. {parent} revint avec la couverture et regarda la page : le cordonnier souriait devant ses souliers. « Ils ont travaillé toute la nuit », {dit_parent}. À la page suivante, on voyait une petite chaise cassée. {prenom} ferma les yeux en souriant.",
        scene:
          "The old storybook lies open on the duvet showing the shoemaker (seen from behind) in front of rows of new shoes, and at the corner of the next page a small broken wooden chair; {parent}'s hand rests on the page; {prenom} drifts to sleep with {doudou} against their cheek and a golden ribbon around the wrist; soft lamplight.",
        presents: ["{parent}"],
      },
    ],
    passages: {
      forme: {
        consigne:
          "Une seule phrase : le fil dessiné sort tout emmêlé, avec une forme qui ressemble à quelque chose que l'enfant aime ou à un détail de son doudou. C'est drôle et tendre. Commence par « Il sortit ».",
        defaut: "Il sortit tout emmêlé, comme un plat de spaghettis.",
        motsMax: 18,
      },
      cadeau: {
        consigne:
          "Un morceau de phrase (sans point final) : une paire de chaussures cousue cette nuit-là, inspirée de ce que l'enfant aime. Commence par « une paire de ».",
        defaut: "une paire de chaussons à pompons, toute petite",
        motsMax: 14,
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
