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

import { elision } from "./titrePrenom";

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
  /**
   * Règles d'image propres à CETTE histoire (anglais) : personnages, objets,
   * ce qu'il ne faut jamais montrer. Ajoutées à la fiche des personnages de
   * chaque illustration du livre ; les règles communes restent dans bibleVisuelle.ts.
   */
  reglesImage?: string;
  /** Personnage du conte à renommer si l'enfant porte le même prénom (ex. { Malo: "Noé" }). */
  remplacants?: Record<string, string>;
  /** Doudou « neutre » des planches (anglais), si l'ours en peluche par défaut prêterait à confusion (histoire avec des ours). */
  doudouNeutre?: string;
}

const TENUE = "soft yellow pyjamas with small orange moons, felt slippers";

/** Série « Le vieux livre de contes » : le crayon blanc et ce que l'enfant dessine (tous les épisodes). */
const REGLES_SERIE =
  "THE WHITE PENCIL: a pure white pencil (white wood and white tip), never an ordinary yellow or wooden pencil. " +
  "WHAT THE CHILD DRAWS: irregular lumpy white shapes of unequal sizes, each outlined by a shaky white pencil line, clearly different from the scenery; " +
  "never a paved path, a road or regular shapes. While it is only drawn: outline only, empty inside. Once it has become real: a full solid shape with a slight golden glow.";

export const HISTOIRES_MAITRESSES: HistoireMaitresse[] = [
  {
    id: "maitresse-petit-poucet",
    episode: 1,
    // Rouverte le 17 nov. 2026 : livre de contrôle (Inès, girafe, Maman) vérifié, 13 planches validées.
    // L'enfant ne rapporte rien du conte : la collection commence par le crayon blanc.
    objet: "le crayon blanc",
    themeId: "petit-poucet",
    // Passé simple, ton du conte : à partir de 4 ans.
    ageMin: 4,
    ageMax: 8,
    titre: "{prenom} au pays du Petit Poucet",
    ritournelle: "« Petit caillou blanc, montre-nous le chemin. »",
    resume:
      "Ce soir, {parent} ouvre le vieux livre de contes de son enfance. Mais à la page du Petit Poucet, les cailloux blancs ont disparu ! Avec un crayon blanc et {doudou}, {prenom} entre dans la forêt du livre pour ramener Poucet et ses frères à la maison.",
    faits:
      "Ce que {prenom} dessine au crayon blanc dans le livre de {parent} devient vrai, et rien n'apparaît tout seul. Le géant n'a jamais été vu, seulement entendu ronfler. Poucet garde dans sa poche un caillou dessiné par {prenom}.",
    tenueHeros: TENUE,
    reglesImage:
      REGLES_SERIE +
      " Little Thumb (Poucet): clearly a little HUMAN BOY (a boy's face, short straight black hair cut above the ears, no fringe over the eyes), red knitted bonnet, brown jacket, a cheerful face, never animal ears; " +
      "ALWAYS the same tiny size on every page: a toy-figurine-sized boy about 25 cm tall, his whole body fits between the ground and the child's knee, and even when the child crouches " +
      "the top of his bonnet stays below the child's chest; next to the child he stands ON something (a mushroom, a stone, a leaf) so his tiny size is obvious; trousers patched, never ripped. " +
      "PEBBLES drawn by the child: separate small crooked pebbles spaced apart, never a paved path, never stepping stones or flagstones. " +
      "The giant: never shown, only suggested by a shadow or boots.",
    cast: [
      {
        nom: "Poucet",
        visuel:
          "HUMAN BOY: a tiny cheerful fairy-tale boy the size of a toy figurine, about 25 cm tall (his whole body fits between the ground and the hero's knee; even next to the crouching hero his bonnet stays below the hero's chest; ALWAYS this size; next to the hero he stands on a mushroom, a stone or a leaf), clearly a little boy (boy's face, short straight black hair above the ears, no fringe over the eyes), red knitted bonnet, brown wool jacket, grey trousers with neat patches (never ripped), little wooden clogs; never looks like the hero.",
      },
    ],
    couverture:
      "Book cover, medium shot: {prenom} stands facing the viewer in a three-quarter front view — we clearly see {prenom}'s face, with the head and body turned the SAME way toward us (never a back view, never the head twisted backwards) — at the near end of a trail of five or six small crooked glowing white pebbles that winds away behind {prenom} into a soft storybook forest with a warm golden glow deep among the trees; each pebble alone in the grass with wide gaps of grass between them (never touching, never a paved path, never stepping stones); {prenom} holds {doudou} in both arms against the chest, the doudou facing the viewer (the ONLY plush toy in the picture); on the grass beside {prenom} stands tiny Poucet, a little HUMAN BOY with a red knitted bonnet and a brown jacket, the top of his bonnet below {prenom}'s knee, never a plush toy; no stones with faces, no objects in {prenom}'s hands other than {doudou}; calm dark-blue starry sky in the upper third for the title.",
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
          "Close-up of the open old storybook on the duvet: on the forest page one single tiny white stone glows softly; {prenom}'s small hand reaches down to touch the glow while the other hand holds a pure white pencil (white wood, white tip); no plush toy in this picture; a gentle light rises from the page in the dim room.",
      },
      {
        texte:
          "Dans le livre, les arbres sentaient l'encre, et la mousse le vieux papier. Un garçon haut comme une botte fouillait sous les fougères : Poucet ! « Mes cailloux se sont effacés, je ne sais pas pourquoi. — Je peux t'aider, dit {prenom}. — Pas besoin, je trouve toujours le chemin. » Au loin, le géant ronflait, et le bord de la page s'assombrit.",
        scene:
          "Inside a soft storybook forest at night: {prenom} stands holding a normal-size pure white pencil (as long as a child's hand) in one hand, the other hand open in a friendly gesture, looking down kindly at Poucet. A few steps away, ALONE on a plain flat grey stone (no mushroom, no face on the stone), stands tiny Poucet: a little HUMAN BOY (his red bonnet below {prenom}'s knee) with a bright RED KNITTED BONNET and a brown jacket, chin raised proudly. NO plush toy in this picture; nothing else near Poucet. Nothing is drawn on the ground (no pebbles yet). The edges of the scene slightly darker.",
        presents: ["Poucet"],
      },
      {
        texte:
          "Poucet sortit un bout de pain de sa poche. Il sema des miettes en chantonnant : « Petit caillou blanc, montre-nous le chemin. » Trois merles gourmands se faufilèrent et picorèrent jusqu'à la dernière miette. Le bord de la page devint plus sombre. Poucet haussa les épaules, mais son menton tremblait un peu. Sans rien dire, {prenom} lui tendit {doudou}. Poucet serra {doudou} contre lui, juste un petit peu.",
        scene:
          "In the storybook forest, three cheeky blackbirds peck up the last breadcrumbs on the path; Poucet, chin trembling, stands ON A MUSHROOM (toy-figurine size, his red bonnet below {prenom}'s chest as {prenom} kneels) and hugs {doudou}, which is bigger than him, that {prenom} has just handed to him; {prenom} kneels and watches kindly; the edges of the scene grow darker.",
        presents: ["Poucet"],
      },
      {
        texte:
          "{prenom} ouvrit la main et posa son caillou par terre. Il brilla, [[comparaison]]. « Petit caillou blanc, montre-nous le chemin », murmura {prenom}. Mais un seul caillou ne faisait pas un chemin. Le ronflement s'arrêta net, et {prenom} retint son souffle. Puis le géant se remit à ronfler. Ouf !",
        scene:
          "On the dim forest path, {prenom} kneels to place one small glowing white stone on the ground, holding their breath with wide eyes; Poucet, a tiny HUMAN BOY with a red knitted bonnet and a brown jacket (his bonnet below {prenom}'s chest as {prenom} kneels), stands beside {prenom}, listening, empty-handed; no plush toy in this picture; a single pool of white light around the lonely stone, dark edges all around.",
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
          "Seen from behind, {prenom} walks with empty hands (NO plush toy in this picture); beside {prenom}, tiny Poucet, a little HUMAN BOY with a bright RED KNITTED BONNET and a brown jacket (toy-figurine size, his bonnet below {prenom}'s knee), stands ON A FLAT STONE and points the way; they are on a grassy forest floor where only a few small crooked glowing white pebbles (four to six) lie far apart from each other, like breadcrumbs, each one alone in the green grass with a big gap of grass between two pebbles (no path, no paving, no stepping stones, no continuous white line), leading into the storybook forest, past a tree stump and a little stream; hopeful warm glow.",
        presents: ["Poucet"],
      },
      {
        texte:
          "Au bout du chemin tordu, une petite maison avait sa fenêtre allumée. Les frères de Poucet coururent vers la porte en riant. Poucet glissa un caillou dessiné dans sa poche. « Merci, {prenom} », dit-il. Tout autour, la page redevint claire.",
        scene:
          "Medium close-up at dusk in front of a small forest cottage whose door stands open, warm golden light spilling out; Poucet's brothers have already run inside, so NO other children are in the picture. In the foreground, {prenom} CROUCHES in the grass, empty-handed, to say goodbye at Poucet's height; facing {prenom}, Poucet, a tiny HUMAN BOY in his red knitted bonnet and brown jacket, with rosy cheeks (toy-figurine size, his bonnet below {prenom}'s chest as {prenom} crouches), slips a small white stone into his jacket pocket and smiles at {prenom}; only two small crooked glowing white pebbles lie in the plain green grass, far apart (no path, no paving, no stepping stones); no plush toy in this picture; Poucet is never a plush toy, never an animal head; soft golden light.",
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
          "Comparer la FORME ou la BRILLANCE du caillou qui brille à quelque chose de familier du monde de l'enfant (tiré de ce qu'il aime, de son doudou ou de son quotidien), JAMAIS sa taille : le caillou est minuscule (pas de « gros », « grand », « énorme »). Commence par « rond comme » ou « doux comme ».",
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
      "Ce que {prenom} dessine au crayon blanc dans le livre de {parent} devient vrai. Les lutins Bobine, Poinçon et Dé ont cousu les souliers avec le fil d'or tordu {de_prenom}, et réparé une botte immense dont on ne sait pas à qui elle appartient. {prenom} a rapporté un bout de ruban doré.",
    tenueHeros: TENUE,
    reglesImage:
      REGLES_SERIE +
      " The three elves Bobine, Poinçon and Dé: TINY (teacup size), each exactly as described, never looks like the hero, never as big as the child. " +
      "The owner of the immense boot: never shown, only suggested.",
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
  {
    id: "maitresse-boucle-d-or",
    themeId: "boucle-d-or",
    episode: 3,
    objet: "une toute petite cuillère en bois",
    // Texte validé le 17 nov. 2026. Fermée aux parents jusqu'à la validation de ses planches.
    ouverte: false,
    ageMin: 4,
    ageMax: 8,
    titre: "La chaise tordue {de_prenom}",
    ritournelle: "« Juste comme il faut ! »",
    resume:
      "Dans le vieux livre de contes de {parent}, Boucle d'or a cassé la petite chaise de Petit Ours, et les trois ours rentrent déjà ! Avec son crayon blanc et {doudou}, {prenom} entre dans la maison des ours pour l'aider à réparer… et à demander pardon.",
    faits:
      "Ce que {prenom} dessine au crayon blanc dans le livre de {parent} devient vrai. Cette fois, Boucle d'or ne s'est pas enfuie : elle a réparé et demandé pardon. La petite chaise de Petit Ours a un pied tordu dessiné par {prenom}. {prenom} a rapporté une toute petite cuillère en bois.",
    tenueHeros: TENUE,
    doudouNeutre: "a plain soft white plush rabbit with long ears",
    reglesImage:
      REGLES_SERIE +
      " Boucle d'or: a HUMAN GIRL about the child's age and height, long bouncy golden curls, a sky-blue dress with a white collar, brown boots; never in pyjamas, never looks like the child. " +
      "The three bears are REAL LIVING BEARS with realistic fur who walk on two legs and ALWAYS wear their clothes, so that none of them could ever look like a teddy bear (Papa Ours: the biggest, green knitted waistcoat; Maman Ourse: blue apron with white dots; Petit Ours: a small cub about the child's height with a red scarf); " +
      "they are never plush toys and are never held in arms. The child's cuddly toy is the ONLY plush toy, in the child's arms or right next to the child. " +
      "A cosy wooden cottage in the woods: three bowls, three chairs and three beds of three sizes. Nothing frightening: the bears are kind and surprised, never angry, never showing teeth or claws.",
    cast: [
      {
        nom: "Boucle d'or",
        visuel:
          "HUMAN GIRL: a little girl about the hero's age and height, long bouncy golden curls, rosy cheeks, a sky-blue dress with a white collar, brown boots; clearly a girl, never in pyjamas, never looks like the hero.",
      },
      {
        nom: "Petit Ours",
        visuel:
          "BEAR CUB: a small friendly brown bear cub walking on two legs, about the hero's height, round ears, a red knitted scarf; a real living cub, never a plush toy, never held in arms.",
      },
      {
        nom: "Papa Ours",
        visuel:
          "BEAR: a big friendly dark-brown bear walking on two legs, twice the hero's height, a green knitted waistcoat; a real living bear, never a plush toy.",
      },
      {
        nom: "Maman Ourse",
        visuel:
          "BEAR: a friendly light-brown bear walking on two legs, a little smaller than Papa Ours, a blue apron with white dots; a real living bear, never a plush toy.",
      },
    ],
    couverture:
      "Book cover, medium shot: inside a cosy wooden cottage in the woods full of warm golden light, {prenom} kneels beside a tiny wooden chair and draws a new crooked chair leg with a pure white pencil, the drawn leg just turning into real wood with a soft golden glow; Boucle d'or, a little HUMAN GIRL with long golden curls in a sky-blue dress, kneels beside {prenom}, watching with wonder; {doudou} sits on the floor right next to {prenom}, the ONLY plush toy in the picture; three bowls of three sizes on the table behind; a calm warm wooden wall in the upper third; no bears in this picture.",
    pages: [
      {
        texte:
          "Ce soir-là, {parent} rouvrit le vieux livre de contes. Sur la page, une petite maison au fond des bois avait la porte grande ouverte. « C'est la maison des trois ours », chuchota {parent}. {prenom} se blottit contre {son_doudou} {doudou}. Sur la table de nuit, le crayon blanc attendait, comme toujours.",
        scene:
          "A cosy child's bedroom at night lit by a warm bedside lamp: {prenom} sits in bed under the duvet hugging {doudou} (the ONLY plush toy); {parent} (seen from behind, face not shown) sits on the edge of the bed holding an old storybook open; a pure white pencil lies on the bedside table; no other characters.",
        presents: [],
      },
      {
        texte:
          "Dans l'image, il y avait trois bols, trois chaises et trois lits. Mais la toute petite chaise était cassée, un pied tombé par terre. À côté, une fillette aux boucles dorées pleurait tout bas. « C'est Boucle d'or, dit {parent}. Elle a fait une bêtise. » Au loin, sur le chemin, on entendait déjà : boum, boum, boum.",
        scene:
          "In the lamp-lit bedroom, {prenom} leans over the open old storybook on the duvet with a worried face, holding {doudou} in one arm; the open page shows a little wooden cottage with three bowls on a table and a tiny broken chair (no letters on the page); no other characters in the room.",
        presents: [],
      },
      {
        texte:
          "{parent} alla chercher un verre d'eau. {prenom} prit le crayon blanc et toucha la petite chaise du bout de la mine. Hop ! {Il} glissa dans la maison des ours, {doudou} dans les bras. Ça sentait le bois chaud et la bouillie à la cannelle.",
        scene:
          "Close-up on the duvet: {prenom}'s small hand touches a tiny broken chair drawn on the page of the open old storybook with the tip of a pure white pencil; a soft golden light rises from the page; {prenom}'s other arm holds {doudou} tight; dim bedroom; no other characters.",
        presents: [],
      },
      {
        texte:
          "Boucle d'or sursauta. « Je voulais juste goûter, m'asseoir, me reposer. Mais tout était trop chaud, trop dur, trop grand… sauf ce qui était à Petit Ours. Et maintenant, sa chaise est cassée ! » Elle regarda la fenêtre. « Dans le livre, je m'enfuis toujours par là. »",
        scene:
          "Inside a cosy wooden cottage in the woods: Boucle d'or, a little HUMAN GIRL with long golden curls in a sky-blue dress, stands by a tiny broken wooden chair whose leg lies on the floor, sad, glancing at the open window; {prenom} stands in front of her holding {doudou} in both arms, listening; on the table three bowls of three sizes; warm light from the window; no bears in this picture.",
        presents: ["Boucle d'or"],
      },
      {
        texte:
          "« Et si, cette fois, on réparait ? » proposa {prenom}. Boucle d'or ouvrit de grands yeux. {prenom} s'accroupit près de la chaise et, la langue entre les dents, dessina un pied tout neuf. Il sortit un peu tordu. Le trait frémit, se gonfla… et le pied devint du vrai bois !",
        scene:
          "Inside the cottage: {prenom} crouches by the tiny broken chair and draws a new crooked chair leg with a pure white pencil, tongue between the teeth; the drawn leg is a shaky white outline just turning into real wood with a slight golden glow; Boucle d'or (little HUMAN GIRL, golden curls, sky-blue dress) kneels beside, amazed; {doudou} sits on the floor next to {prenom}, the ONLY plush toy; no bears in this picture.",
        presents: ["Boucle d'or"],
      },
      {
        texte:
          "Boum, boum, boum. Les pas se rapprochaient. Boucle d'or tremblait comme une feuille. {prenom} lui tendit {doudou} : « Tiens. On a moins peur quand on serre quelqu'un. » Ensemble, ils posèrent la petite chaise bien droite, à sa place, au bout de la table.",
        scene:
          "Inside the cottage near the closed wooden door: Boucle d'or (little HUMAN GIRL, golden curls, sky-blue dress) hugs {doudou}, the ONLY plush toy, a little scared; {prenom} stands beside her with a reassuring smile, one hand on her shoulder; the repaired tiny chair stands straight at the end of the table; no bears visible, only big soft shadows of paws under the door.",
        presents: ["Boucle d'or"],
      },
      {
        texte:
          "La porte grinça. Papa Ours, Maman Ourse et Petit Ours entrèrent, le museau tout rose de froid. Ils virent les bols vides, les coussins de travers… et deux enfants debout près de la table. Petit Ours fronça son petit nez : « Qui s'est assis sur ma chaise ? »",
        scene:
          "Seen from inside the cottage: the wooden door opens and the three bears stand in the doorway, surprised and kind, noses pink from the cold: Papa Ours (the biggest, dark brown, green knitted waistcoat), Maman Ourse (light brown, blue apron with white dots) and Petit Ours (a small cub with a red scarf); autumn woods behind them; no children and no plush toy in this picture.",
        presents: ["Papa Ours", "Maman Ourse", "Petit Ours"],
      },
      {
        texte:
          "Boucle d'or rendit {doudou} et fit un pas en avant, toute rouge. « C'est moi. Pardon, Petit Ours. J'ai mangé ta bouillie et cassé ta chaise… alors on l'a réparée. » Petit Ours regarda le pied neuf, un peu tordu. Il s'assit dessus, gigota… et sourit : « Ni trop dur, ni trop mou. Juste comme il faut ! »",
        scene:
          "Inside the cottage: Petit Ours, a small brown bear cub with a red scarf, sits proudly on the tiny repaired wooden chair (one leg a little crooked), smiling; Boucle d'or (little HUMAN GIRL, golden curls, sky-blue dress) stands beside him, cheeks pink, saying sorry; {prenom} stands a step behind holding {doudou} in both arms, smiling; Papa Ours and Maman Ourse are not in this picture.",
        presents: ["Petit Ours", "Boucle d'or"],
      },
      {
        texte:
          "Maman Ourse remit de la bouillie à chauffer, juste comme il faut, pour tout le monde. On mangea, on rit, on goûta trois fois. Au moment de partir, Petit Ours glissa dans la main {de_prenom} une toute petite cuillère en bois. « Pour que tu reviennes goûter », dit-il.",
        scene:
          "A warm close scene at the wooden table of the cottage: Petit Ours (small brown cub, red scarf) places a tiny wooden spoon in {prenom}'s open hand; {prenom} holds {doudou} in the other arm; Boucle d'or (little HUMAN GIRL, golden curls, sky-blue dress) eats porridge from a bowl beside them, smiling; Papa Ours and Maman Ourse only seen from behind at the stove in the background; warm golden light.",
        presents: ["Petit Ours", "Boucle d'or"],
      },
      {
        texte:
          "{prenom} était de nouveau dans son lit, {doudou} contre sa joue, la petite cuillère au creux de la main. {parent} revint et regarda le livre : sur la page, Boucle d'or et Petit Ours mangeaient côte à côte. « Tiens, je ne me souvenais pas de cette fin-là », murmura {parent}. {prenom} sourit et ferma les yeux.",
        scene:
          "A cosy child's bedroom at night: {prenom} drifts to sleep against the pillow with {doudou} against the cheek and a tiny wooden spoon in one hand; {parent}'s hand rests on the open old storybook, whose page shows a little girl with golden curls and a bear cub eating porridge side by side (no letters); the pure white pencil back on the bedside table; soft lamplight.",
        presents: [],
      },
    ],
    passages: {},
  },
  {
    id: "maitresse-peur-du-noir",
    themeId: "peur-du-noir",
    // Texte validé le 17 nov. 2026. Fermée aux parents jusqu'à la validation de ses planches.
    ouverte: false,
    // Phrases courtes : dès 3 ans.
    ageMin: 3,
    ageMax: 7,
    titre: "La chasse aux ombres {de_prenom}",
    ritournelle: "« Un, deux, trois… lumière ! »",
    resume:
      "Ce soir, dans le noir, une drôle d'ombre bouge sur le mur, un bruit fait glou-glou et deux petits points brillent tout là-haut… Avec sa lampe de poche et {doudou}, {prenom} part à la chasse aux ombres. Un, deux, trois… lumière !",
    faits:
      "{prenom} n'a plus peur du noir : chaque ombre était une chose gentille de sa chambre (la robe de chambre de {parent}, le radiateur qui chante, les étoiles du plafond). {prenom} sait faire un oiseau d'ombre avec ses mains.",
    tenueHeros: TENUE,
    reglesImage:
      "THE SAME cosy child's bedroom on every page: a bed with a blue duvet, a door left slightly open with a thin line of warm hallway light, a soft pink dressing gown hanging on the back of the door, a white radiator under the window, glow-in-the-dark star stickers on the ceiling. " +
      "THE TORCH: a small yellow pocket torch with a round warm beam. Night lighting, calm and soft, NEVER scary: shadows are soft and round, no monster, no eyes, no face in any shadow. " +
      "LUMINOUS NIGHT on every page: warm light from the half-open door and the torch beam; the child's face and the cuddly toy are always clearly and brightly lit, never a dark muddy picture. " +
      "The only characters are the child, the child's cuddly toy and, on some pages, the parent; nobody else.",
    cast: [],
    couverture:
      "Book cover, medium shot: in a cosy dark bedroom, {prenom} sits up in bed under a blue duvet, holding {doudou} in one arm (the ONLY plush toy) and a small yellow pocket torch in the other hand; the round warm beam lights up glow-in-the-dark star stickers on the ceiling; wonder and calm, nothing scary; a calm dark-blue wall area in the upper third; no other characters.",
    pages: [
      {
        texte: "Ce soir, {parent} éteignit la grande lumière. « Bonne nuit, mon trésor. » La porte resta un peu ouverte. Dans le noir, {prenom} serra {son_doudou} {doudou} très fort.",
        scene:
          "A cosy child's bedroom at night: {parent} (seen from behind, face not shown) stands at the door, a hand on the light switch, the big light going off; {prenom} lies in bed under the blue duvet hugging {doudou}; the door slightly open with a thin line of warm hallway light; a soft pink dressing gown hangs on the back of the door.",
        presents: [],
      },
      {
        texte: "Sur le mur, une grande ombre bougeait. Elle avait deux bras tout mous… et pas de tête ! {prenom} ne bougeait plus. {Il} retenait son souffle.",
        scene:
          "The dark bedroom seen from the bed: on the wall, a big soft shadow with two floppy arms and no head (the shadow of a dressing gown, which we do not see clearly); {prenom}, in bed under the blue duvet, holds {doudou} tight with wide eyes; soft calm night colours, nothing scary, no face in the shadow; no other characters.",
        presents: [],
      },
      {
        texte: "Sous l'oreiller, il y avait la lampe de poche. {prenom} la prit et partit à la chasse aux ombres. {Il} compta tout bas : « Un, deux, trois… lumière ! »",
        scene:
          "In bed in the dark, {prenom} pulls a small yellow pocket torch from under the pillow and switches it on, whispering, {doudou} tucked under one arm; only a little warm light from the half-open door; calm and cosy; no other characters.",
        presents: [],
      },
      {
        texte: "Le rond de lumière monta sur le mur… C'était la robe de chambre de {parent}, pendue à la porte ! Ses manches pendaient, toutes molles. {prenom} pouffa de rire.",
        scene:
          "{prenom} sits up in bed shining the yellow pocket torch at the door: the round warm beam lights up a soft pink dressing gown hanging on the door, its empty sleeves dangling; {prenom} giggles, {doudou} in the other arm; cosy dark bedroom; no other characters.",
        presents: [],
      },
      {
        texte: "Glou, glou, tic ! Un drôle de bruit. {prenom} serra {doudou}. « Un, deux, trois… lumière ! » C'était le radiateur, qui chantait tout bas en se réchauffant.",
        scene:
          "{prenom} kneels on the bed shining the yellow pocket torch at the white radiator under the window; a few soft curls of warm air rise above it; {prenom} holds {doudou} close, smiling with relief; cosy dark bedroom; no other characters.",
        presents: [],
      },
      {
        texte: "Tout là-haut, dans le coin, deux petits points verts brillaient. Deux points tout ronds, qui ne bougeaient pas. {prenom} leva sa lampe. « Un, deux, trois… lumière ! »",
        scene:
          "The dark bedroom: near the ceiling in the far corner, two tiny round dots of soft green light shine (they are small star stickers seen from far: plain round dots, never eyes, no face around them); {prenom}, sitting in bed, points the yellow pocket torch toward them, curious, {doudou} under one arm; nothing scary, no eyes, no face; no other characters.",
        presents: [],
      },
      {
        texte: "C'étaient les étoiles collées au plafond ! Elles avaient gardé un peu de soleil pour la nuit. Elles brillaient encore, rien que pour {prenom}.",
        scene:
          "The torch beam reveals glow-in-the-dark star stickers on the ceiling, softly glowing green; {prenom} lies back on the pillow with {doudou}, gazing up at them with wonder; cosy dark bedroom; no other characters.",
        presents: [],
      },
      {
        texte: "Alors {prenom} eut une idée. {Il} posa la lampe sur le lit et croisa ses deux mains devant la lumière. Sur le mur, un grand oiseau ouvrit ses ailes !",
        scene:
          "{prenom} sits in bed with {doudou} beside on the pillow; the yellow pocket torch lies on the duvet pointing at the wall; {prenom}'s two crossed hands in front of the beam make a big soft bird-shaped shadow with open wings on the wall; delight; no other characters.",
        presents: [],
      },
      {
        texte: "{parent} passa la tête par la porte. « Tout va bien ? » {prenom} sourit : « Oui. Le noir, c'est juste la chambre qui dort. » Et {il} éteignit sa lampe, sans aide.",
        scene:
          "{parent} (face in soft shadow, not detailed) peeks through the half-open door with warm hallway light behind; {prenom}, sitting in bed hugging {doudou}, smiles proudly and switches off the yellow pocket torch; cosy bedroom.",
        presents: [],
      },
      {
        texte: "Dans le noir tout doux, la robe de chambre dormait, le radiateur chantait, les étoiles veillaient. {prenom} ferma les yeux, {doudou} contre sa joue. Un, deux, trois… dodo.",
        scene:
          "The calm dark bedroom: {prenom} asleep in bed under the blue duvet with {doudou} against the cheek, the yellow pocket torch switched off on the bedside table; the pink dressing gown on the door, the white radiator under the window and the glowing star stickers on the ceiling; peaceful soft night colours; no other characters.",
        presents: [],
      },
    ],
    passages: {},
  },
  {
    id: "maitresse-petite-souris",
    themeId: "petite-souris",
    // Texte validé le 17 nov. 2026. Fermée aux parents jusqu'à la validation de ses planches.
    ouverte: false,
    ageMin: 4,
    ageMax: 8,
    titre: "La première dent {de_prenom}",
    ritournelle: "« Chut, c'est un secret. »",
    resume:
      "Ce soir, {prenom} a perdu sa première dent. Sous l'oreiller, la petite boîte attend la petite souris… mais la petite souris n'arrive pas à la prendre ! Avec {doudou}, {prenom} va l'aider, et découvrir ce qu'elle fait de toutes les dents du monde.",
    faits:
      "La petite souris porte une cape violette et une lanterne grande comme un dé à coudre. Elle construit un château avec les dents tombées ; la première dent {de_prenom} est tout en haut de la plus haute tour. Le trou de souris est derrière la plinthe de la chambre. C'est un secret.",
    tenueHeros: TENUE,
    reglesImage:
      "THE SAME cosy child's bedroom: a bed with a blue duvet and a white pillow, a bedside lamp, a small wooden tooth box, a little mouse hole in the skirting board near the bed. " +
      "LUMINOUS NIGHT on every page: warm light from the bedside lamp, the mouse's tiny lantern or the moon; faces and characters always clearly and brightly lit, never a dark muddy picture. " +
      "Petite Souris: a real living grey mouse walking on two legs, a lavender velvet cape, round pink ears, long whiskers, a tiny glowing lantern; never a plush toy. The child's cuddly toy is the ONLY plush toy. " +
      "The tooth castle: walls of small shiny white pearl-like stones (the teeth), cute and magical, never creepy; never show a mouth, gums or blood. Nothing frightening.",
    cast: [
      {
        nom: "Petite Souris",
        visuel:
          "MOUSE: a real living little grey mouse walking on two legs, round pink ears, long whiskers, a lavender velvet cape, a tiny glowing lantern in one paw; about the size of the child's hand, except when the scene says the child has become tiny; never a plush toy.",
      },
    ],
    couverture:
      "Book cover, medium shot: a cosy child's bedroom at night in warm lamplight; {prenom} lies in bed, head on the white pillow, eyes half open with a delighted smile, holding {doudou} (the ONLY plush toy); at the edge of the pillow stands Petite Souris, a little grey mouse in a lavender cape holding a tiny glowing lantern, looking at {prenom} with a finger on her lips; the faces clearly lit; a calm dark-blue wall area in the upper third.",
    pages: [
      {
        texte:
          "Ce soir, {prenom} tenait dans sa main une toute petite dent : sa première dent tombée ! {parent} la rangea dans une petite boîte en bois, sous l'oreiller. « Cette nuit, la petite souris va passer », {dit_parent}.",
        scene:
          "A cosy child's bedroom at night in warm lamplight: {prenom} sits in bed, proudly showing a tiny white tooth in an open palm, with a little gap in the smile; {parent} (seen from behind, face not shown) slips a small wooden box under the white pillow; {doudou} on the duvet next to {prenom}; the little mouse hole in the skirting board near the bed is clearly visible; faces clearly lit.",
        presents: [],
      },
      {
        texte:
          "{prenom} voulait la voir, la petite souris. Alors, sous la couette, {il} fit semblant de dormir, {doudou} contre son cœur, une oreille aux aguets.",
        scene:
          "In bed under the blue duvet, {prenom} pretends to sleep but peeks with one eye open, hugging {doudou} close; the bedside lamp dimmed to a soft warm glow that keeps the face clearly lit; the little mouse hole in the skirting board near the bed is visible; no other characters.",
        presents: [],
      },
      {
        texte:
          "Tic, tic, tic. Une toute petite lumière traversa la chambre. Au bord du lit, une souris grise, avec une cape violette et une lanterne grande comme un dé à coudre, regardait l'oreiller. « Oh là là, soupira-t-elle. Pile dessus ! »",
        scene:
          "At the edge of the bed: Petite Souris, a little grey mouse in a lavender cape holding a tiny glowing lantern, stands on the duvet looking at the white pillow with a worried face; {prenom}'s head rests on the pillow, one eye peeking, {doudou} in the arms; the lantern lights the scene warmly.",
        presents: ["Petite Souris"],
      },
      {
        texte:
          "La petite souris tira, poussa, se faufila. Rien à faire : l'oreiller ne bougeait pas d'un poil. {prenom} ne put s'empêcher de chuchoter : « Je peux t'aider ? » La petite souris fit un bond. « Tu ne dors pas ? »",
        scene:
          "Petite Souris (little grey mouse, lavender cape) pushes with all her strength against the corner of the white pillow, her tiny lantern set down on the duvet; {prenom} lifts the head and whispers to her with a smile, {doudou} in one arm; the mouse jumps with surprise; warm light.",
        presents: ["Petite Souris"],
      },
      {
        texte:
          "« Chut, c'est un secret », dit {prenom}. {Il} souleva l'oreiller tout doucement et tendit la petite boîte. La petite souris ouvrit le couvercle, et ses moustaches tremblèrent de joie : « Une première dent ! La plus précieuse de toutes ! »",
        scene:
          "{prenom}, sitting up in bed, holds out the small open wooden box with a tiny white tooth inside; Petite Souris (little grey mouse, lavender cape) looks into the box with sparkling eyes and trembling whiskers; {doudou} on the duvet beside {prenom}; warm lantern and lamp light.",
        presents: ["Petite Souris"],
      },
      {
        texte:
          "« Qu'est-ce que tu en fais, des dents ? » demanda {prenom}. La petite souris cligna de l'œil : « Viens voir ! » Elle toucha le nez {de_prenom} avec sa lanterne… et hop ! {prenom} se retrouva de la taille d'une souris, {doudou} dans les bras.",
        scene:
          "Magical moment on the duvet: {prenom} has just become TINY, the size of a mouse, standing on the blue duvet and holding a tiny {doudou} in the arms; next to {prenom}, Petite Souris (grey mouse, lavender cape) now looks as tall as {prenom}, touching {prenom}'s nose with her glowing lantern; sparkles of golden light; the huge pillow and folds of the duvet all around.",
        presents: ["Petite Souris"],
      },
      {
        texte:
          "Derrière la plinthe, il y avait un trou de souris. Et derrière le trou, un château ! Ses murs étaient faits de petites dents blanches, qui brillaient comme des perles au clair de lune.",
        scene:
          "Inside the mouse hole behind the skirting board: a magical little castle whose walls are made of small shiny white pearl-like stones, glowing softly in moonlight; tiny {prenom} (the same size as the mouse) stands in wonder at the entrance, holding {doudou}; Petite Souris (grey mouse, lavender cape) leads the way with her glowing lantern; cute and magical, never creepy.",
        presents: ["Petite Souris"],
      },
      {
        texte:
          "« Chaque dent tombée est une pierre de mon château, expliqua la petite souris. Et la tienne, je la garde pour la plus haute tour. » Elle posa la dent tout en haut. La tour se mit à briller plus fort que toutes les autres.",
        scene:
          "At the top of the pearl-white castle: Petite Souris (grey mouse, lavender cape) places one small shiny white stone on the very top of the highest tower, which glows brighter than all the others; tiny {prenom} watches from a balcony below, holding {doudou}, amazed; soft moonlight and lantern glow.",
        presents: ["Petite Souris"],
      },
      {
        texte:
          "« Merci de m'avoir aidée », dit la petite souris. Elle glissa une pièce dorée dans la boîte, puis toucha encore le nez {de_prenom}. Hop ! {prenom} était de retour dans son lit, à sa vraie taille, {doudou} contre sa joue.",
        scene:
          "Back in the bedroom: {prenom}, at normal size again, lies in bed with {doudou} against the cheek, smiling sleepily; on the duvet, Petite Souris (little grey mouse, lavender cape) slips a shiny golden coin into the small wooden box and waves goodbye; warm lamplight.",
        presents: ["Petite Souris"],
      },
      {
        texte:
          "Au matin, {prenom} ouvrit la boîte : à la place de la dent, il y avait une pièce dorée. {parent} sourit : « Alors, tu l'as vue ? » {prenom} montra le petit trou derrière la plinthe, posa un doigt sur ses lèvres et chuchota : « Chut, c'est un secret. »",
        scene:
          "Sunny morning in the bedroom: {prenom} sits in bed holding the open wooden box with a shiny golden coin inside, a finger on the lips with a mischievous smile; {doudou} on the pillow; {parent} (seen from behind, face not shown) at the door; the little mouse hole in the skirting board is visible near the bed; bright morning light.",
        presents: [],
      },
    ],
    passages: {},
  },
  {
    id: "maitresse-anniversaire",
    themeId: "anniversaire",
    // Écrite le 17 nov. 2026, texte à valider. Fermée aux parents jusqu'à la validation de ses planches.
    ouverte: false,
    // Phrases courtes : dès 3 ans.
    ageMin: 3,
    ageMax: 8,
    titre: "La surprise {de_prenom}",
    ritournelle: "« Surprise ! »",
    resume:
      "Le jour de son anniversaire, {prenom} se réveille tout excité… mais personne ne dit rien ! On chuchote, on cache des choses, on ferme les portes. Alors, avec {doudou}, {prenom} décide de préparer une surprise. Mais qui va surprendre qui ?",
    faits:
      "Le jour de son anniversaire, {prenom} a fabriqué une couronne en papier un peu tordue pour {parent}. Toute la famille cachait une fête dans le jardin. Le vœu {de_prenom} est un secret.",
    tenueHeros: "a cheerful orange t-shirt with a small yellow star, blue trousers, white sneakers",
    reglesImage:
      "A bright cosy family house with a garden. The birthday party: colourful balloons, a garland in the tree, confetti, a big birthday cake with lit candles; NO numbers or letters anywhere (not on the cake, the candles, the balloons or a banner). " +
      "Friends and family guests: only a few, at the edges of the picture or seen from behind, faces not detailed, never dressed like the child. " +
      "The paper crown: a handmade yellow paper crown, a little crooked, with one crooked star. Faces always clearly lit.",
    cast: [],
    couverture:
      "Book cover, medium shot: in a sunny garden decorated with colourful balloons and a garland in the tree, {prenom} stands in the middle, arms wide open with delight under falling confetti, holding {doudou} in one hand (the ONLY plush toy); a big birthday cake with lit candles on a garden table beside (no numbers, no letters); a calm sky in the upper third; no other characters in the foreground.",
    pages: [
      {
        texte: "Ce matin-là, {prenom} ouvrit les yeux d'un coup. C'était le jour de son anniversaire ! {Il} sauta du lit avec {doudou} et courut à la cuisine.",
        scene:
          "Sunny morning in the hallway of a cosy family house: {prenom} runs toward the kitchen with a huge smile, holding {doudou} in one arm; bright morning light; no other characters.",
        presents: [],
      },
      {
        texte: "Mais {parent} buvait son café sans lever les yeux. « Bonjour, mon trésor. » C'est tout. Pas de bisou d'anniversaire, pas de chanson, rien du tout.",
        scene:
          "A bright kitchen in the morning: {parent} (seen from behind or in profile in soft shadow, face not detailed) sits at the table with a cup of coffee, busy; {prenom} stands in the doorway holding {doudou}, the smile fading into surprise; no other characters.",
        presents: [],
      },
      {
        texte: "Toute la journée, ce fut pareil. On chuchotait derrière les portes. On cachait des choses. Et quand {prenom} arrivait… plus personne ne disait rien.",
        scene:
          "Inside the house: {prenom}, holding {doudou}, looks puzzled at a door left ajar, behind which only colourful hints are visible (the corner of a balloon, a ribbon); nobody visible; bright daylight.",
        presents: [],
      },
      {
        texte: "Le soir, {prenom} s'assit sur les marches, {doudou} sur les genoux. « Ils ont oublié », murmura {prenom}. Une grosse larme roula sur sa joue.",
        scene:
          "Golden late-afternoon light on the steps of the house: {prenom} sits on a step with {doudou} on the knees, looking sad, one big tear on the cheek; face clearly lit; no other characters.",
        presents: [],
      },
      {
        texte: "Puis {prenom} renifla et se releva. « Tant pis. Moi, je vais leur faire une surprise. » Avec du papier, de la colle et des crayons, {il} fabriqua une couronne pour {parent}.",
        scene:
          "At a small table by the window: {prenom} makes a yellow paper crown with paper, glue and coloured pencils, tongue between the teeth, determined; {doudou} sits on the table watching; warm light; no other characters.",
        presents: [],
      },
      {
        texte: "La couronne était un peu tordue, mais très belle. « Garde le secret », souffla {prenom} à l'oreille {de_doudou}. {Il} cacha la couronne dans son dos et ouvrit la porte du jardin.",
        scene:
          "{prenom}, at the garden door, whispers into the ear of {doudou} held in one arm, a little crooked yellow paper crown with one crooked star hidden behind the back; the door opening onto the bright garden; no other characters.",
        presents: [],
      },
      {
        texte: "SURPRISE ! Des ballons partout, une guirlande dans l'arbre, des amis qui riaient, et {parent} avec un énorme gâteau. « Joyeux anniversaire, {prenom} ! »",
        scene:
          "The garden bursting with a surprise party: colourful balloons everywhere, a garland in the tree, confetti in the air; {prenom} in front, mouth wide open with joy, holding {doudou}; {parent} (face in soft shadow, not detailed) carries a big birthday cake with lit candles (no numbers, no letters); a few laughing friends at the edges, seen from behind.",
        presents: [],
      },
      {
        texte: "« C'est pour ça qu'on se cachait toute la journée ! », dit {parent} en riant. {prenom} sortit la couronne de son dos. « Moi aussi, j'ai une surprise ! » Et {il} la posa sur la tête de {parent}.",
        scene:
          "In the decorated garden: {prenom} stands on tiptoe and places the crooked yellow paper crown on the head of {parent} (seen in profile, face in soft shadow, not detailed), who laughs; {doudou} sits on the grass right next to {prenom}; balloons around; no other characters in the foreground.",
        presents: [],
      },
      {
        texte: "Sur le gâteau, les bougies brillaient. {prenom} ferma les yeux, fit un vœu très fort et souffla. Pfff ! Toutes les bougies s'éteignirent d'un coup. Tout le monde applaudit.",
        scene:
          "Close-up at the garden table: {prenom}, cheeks puffed, blows out the lit candles on a big birthday cake (no numbers, no letters on the cake or candles), eyes closed; {doudou} sits on the table beside the cake; hands of guests clapping at the edges; warm evening light.",
        presents: [],
      },
      {
        texte: "Le soir, dans son lit, {prenom} serra {doudou}. {parent} posa la couronne tordue sur la table de nuit. Son vœu ? Chut… un vœu, ça ne se dit pas.",
        scene:
          "A cosy bedroom at night in warm lamplight: {prenom} lies in bed hugging {doudou}, smiling with closed eyes; on the bedside table, the little crooked yellow paper crown; a balloon floating near the ceiling; no other characters.",
        presents: [],
      },
    ],
    passages: {},
  },
  {
    id: "maitresse-rentree",
    themeId: "rentree",
    // Écrite le 17 nov. 2026, texte à valider. Fermée aux parents jusqu'à la validation de ses planches.
    ouverte: false,
    // Phrases courtes : dès 3 ans (entrée en maternelle).
    ageMin: 3,
    ageMax: 6,
    titre: "Le code secret {de_prenom}",
    ritournelle: "« Un, deux, trois : je pense à toi. »",
    resume:
      "C'est le premier jour d'école, et {prenom} a le ventre tout noué. Heureusement, {doudou} est caché dans le cartable, et {parent} a un code secret : un, deux, trois… À la récréation, {prenom} va s'en servir pour aider quelqu'un.",
    faits:
      "Le code secret de {parent} et {prenom} : serrer la main trois fois, « Un, deux, trois : je pense à toi ». {prenom} l'a appris à Malo, son premier copain d'école. {doudou} vient à l'école caché dans le cartable.",
    tenueHeros: "a blue sweatshirt with a small yellow star, red trousers, white sneakers, a small green backpack",
    remplacants: { Malo: "Noé" },
    reglesImage:
      "A bright cheerful nursery school: a colourful classroom with cushions, crayons and a goldfish bowl; a playground with a big tree and a slide; sunny daytime. " +
      "The teacher: a kind adult woman with round glasses and a soft cardigan. Other children only in the background, small, faces not detailed, never dressed like the child. " +
      "NO letters or numbers anywhere (no alphabet on the walls, no writing on the school, no hopscotch numbers). The child's cuddly toy is the ONLY plush toy, usually peeking out of the green backpack.",
    cast: [
      {
        nom: "Malo",
        visuel:
          "HUMAN BOY: a little boy about the hero's age and height, straight black hair, a yellow cap and a yellow sweatshirt, red sneakers; never looks like the hero.",
      },
    ],
    couverture:
      "Book cover, medium shot: in front of a bright cheerful school gate on a sunny morning, {prenom} with a small green backpack, {doudou} peeking out of the backpack (the ONLY plush toy), holds the hand of {parent} (only the adult's arm and hand visible) and looks ahead with a brave little smile; a big tree and colourful school windows behind (no letters); a calm sky in the upper third.",
    pages: [
      {
        texte: "Ce matin, {prenom} avait le ventre tout noué. C'était le premier jour d'école ! Dans son cartable, {il} glissa {son_doudou} {doudou}, pour le courage. {doudou} dépassait juste un peu.",
        scene:
          "A bedroom in the morning: {prenom}, dressed for school, slips {doudou} into a small green backpack, {doudou}'s head peeking out, with a nervous little smile; bright morning light; no other characters.",
        presents: [],
      },
      {
        texte: "Devant l'école, il y avait beaucoup d'enfants et beaucoup de bruit. {prenom} serra très fort la main de {parent}. « Et si personne ne veut jouer avec moi ? »",
        scene:
          "In front of the school gate on a sunny morning: {prenom}, the green backpack on the back with {doudou} peeking out, holds tight the hand of {parent} (only the adult's arm and hand, or a silhouette from behind); busy children in the background, small and blurred; no letters on the school.",
        presents: [],
      },
      {
        texte: "{parent} s'accroupit. « Tu connais notre code secret ? » Et {parent} serra sa main trois fois : un, deux, trois. « Un, deux, trois : je pense à toi. Même quand je ne suis pas là. »",
        scene:
          "At the school gate: {parent} (crouching, seen from behind or in soft profile, face not detailed) squeezes {prenom}'s hand; close-up on the two joined hands in the foreground; {prenom} listens with big eyes, {doudou} peeking out of the green backpack; warm morning light.",
        presents: [],
      },
      {
        texte: "Dans la classe, la maîtresse avait des lunettes rondes et une voix toute douce. Il y avait des crayons de toutes les couleurs et un poisson rouge. Mais {parent} n'était plus là.",
        scene:
          "A colourful nursery classroom: the teacher, a kind adult woman with round glasses, smiles gently; {prenom} stands near a table with crayons and a goldfish bowl, looking a little lost, the green backpack hanging nearby with {doudou} peeking out; a few children in the background, faces not detailed; no letters or numbers on the walls.",
        presents: [],
      },
      {
        texte: "À la récréation, {doudou} dépassait toujours du cartable. {prenom} lui fit un bisou en cachette. Ça allait déjà mieux.",
        scene:
          "A corner of the sunny playground: {prenom} crouches by the green backpack, {doudou} peeking out of it, and gives {doudou} a secret kiss; a soft smile; the big tree behind; no other characters close by.",
        presents: [],
      },
      {
        texte: "Près du grand arbre, un garçon à la casquette jaune pleurait. Il s'appelait Malo, et sa maman lui manquait très fort.",
        scene:
          "Under the big tree of the playground: Malo, a little HUMAN BOY with straight black hair, a yellow cap and a yellow sweatshirt, sits against the trunk crying; {prenom} watches him from a few steps away, holding the green backpack strap; sunny day; no other children close by.",
        presents: ["Malo"],
      },
      {
        texte: "{prenom} s'approcha. « Tu veux connaître un code secret ? » {Il} prit la main de Malo et la serra trois fois. « Un, deux, trois : je pense à toi. Ça marche même à l'école. »",
        scene:
          "Under the big tree: {prenom} kneels next to Malo (little HUMAN BOY, straight black hair, yellow cap, yellow sweatshirt) and squeezes his hand, smiling kindly; Malo looks up, his tears drying; the green backpack with {doudou} peeking out lies beside them.",
        presents: ["Malo"],
      },
      {
        texte: "Malo renifla… et sourit. Ensemble, ils jouèrent au toboggan, au ballon, puis aux pirates du bac à sable. La récréation passa beaucoup trop vite.",
        scene:
          "The sunny playground: {prenom} and Malo (little HUMAN BOY, straight black hair, yellow cap, yellow sweatshirt) laugh together at the bottom of a colourful slide; a ball nearby; other children far in the background, faces not detailed; {doudou} not in this picture.",
        presents: ["Malo"],
      },
      {
        texte: "À la sortie, {parent} attendait au portail. {prenom} courut et sauta dans ses bras. Puis {prenom} serra sa main trois fois : « J'ai un copain. Il s'appelle Malo ! »",
        scene:
          "At the school gate in the afternoon: {prenom} jumps into the arms of {parent} (seen from behind, face not shown), the green backpack bouncing with {doudou} peeking out; warm golden afternoon light; children far in the background.",
        presents: [],
      },
      {
        texte: "Le soir, {prenom} rangea {doudou} dans le cartable, pour demain. Puis {il} chuchota, les yeux qui se fermaient : « Un, deux, trois… vivement l'école ! »",
        scene:
          "A cosy bedroom at night in warm lamplight: {prenom} in bed, eyes closing with a smile; the green backpack by the bed with {doudou} peeking out of it, ready for tomorrow; no other characters.",
        presents: [],
      },
    ],
    passages: {},
  },
  {
    id: "maitresse-tour-du-monde",
    themeId: "tour-du-monde",
    // « La bibliothèque des aventuriers » (9-12 ans), épisode 1. Retouché le 18 nov. 2026 : texte à relire par la propriétaire avant toute planche.
    ouverte: false,
    ageMin: 9,
    ageMax: 12,
    objet: "un billet de train de 1872",
    titre: "Le tour du monde {de_prenom}",
    ritournelle: "« Pas une minute de plus. »",
    resume:
      "Dans le vieux livre de {parent}, Phileas Fogg a parié qu'il ferait le tour du monde en quatre-vingts jours. Avec un carnet de voyage où l'on n'a droit qu'à quatre lignes, {prenom} entre dans le roman de Jules Verne : trains, paquebots, éléphant, tempête… et un inspecteur qui les suit partout.",
    faits:
      "Le carnet de voyage de {parent} : ce que l'on y écrit devient vrai, quatre lignes en tout. {prenom} a aidé Phileas Fogg à gagner son pari : un pont de lianes, des voiles qui tiennent, et le jour gagné en voyageant vers l'est. {prenom} a rapporté un billet de train de 1872. Une ligne du carnet reste à écrire.",
    tenueHeros: "a dark blue sweater, beige trousers, brown boots, a small worn leather travel notebook",
    reglesImage:
      "THE ERA: 1872, the Victorian age: steamships, steam trains, gas lamps, top hats; never anything modern. The child wears modern simple clothes and stands out a little. " +
      "THE TRAVEL NOTEBOOK: a small worn brown leather notebook, always with the child. When a line written in it becomes real, the new thing glows faintly golden and looks a little crooked. " +
      "Phileas Fogg: always calm, black top hat, dark grey frock coat, silver pocket watch. Passepartout: round-faced Frenchman, red waistcoat. Inspector Fix: comic, never scary, bowler hat and big moustache. " +
      "AT MOST THREE characters in each picture, the child included: no crowds, no extras, no background people unless the scene names them. " +
      "Only things from Jules Verne's novel: NO hot-air balloon anywhere. " +
      "Nothing frightening; NO letters or numbers anywhere (newspapers, signs, tickets and clocks without writing).",
    cast: [
      {
        nom: "Phileas Fogg",
        visuel:
          "HUMAN MAN: a tall slim English gentleman of about forty, very calm, neat light-brown hair and sideburns, a black top hat, a dark grey frock coat, a silver pocket watch on a chain; Victorian era.",
      },
      {
        nom: "Passepartout",
        visuel:
          "HUMAN MAN: a cheerful round-faced Frenchman of about thirty, curly black hair, a red waistcoat over a white shirt, brown trousers; lively and kind; Victorian era.",
      },
      {
        nom: "Fix",
        visuel:
          "HUMAN MAN: a thin police inspector with a big brown moustache, a bowler hat and a long brown overcoat, comic and suspicious, never scary; Victorian era.",
      },
      {
        nom: "Kiouni",
        visuel:
          "ELEPHANT: a huge gentle Indian elephant with kind eyes and a colourful embroidered red and gold blanket on its back; a real living animal.",
      },
    ],
    couverture:
      "Book cover, medium shot: {prenom} sits proudly on the back of Kiouni, a huge gentle Indian elephant with a colourful embroidered blanket, facing the viewer with a big smile and holding up a small leather travel notebook; Phileas Fogg (tall gentleman, black top hat, grey frock coat) walks beside the elephant checking his silver pocket watch; in the background, a steam train and a steamship under a golden sunrise sky; calm sky in the upper third; no letters anywhere.",
    pages: [
      {
        texte:
          "Chapitre 1 — Le vieux livre de {parent}\nCe soir-là, {parent} posa sur le lit un gros livre à la couverture de cuir usé : Le Tour du monde en quatre-vingts jours. Dedans, glissé entre deux pages, il y avait un petit carnet de voyage. « C'était à moi quand j'avais ton âge, {dit_parent}. Une seule règle : quatre lignes, pas une de plus. » Puis {parent} éteignit la grande lumière en souriant, comme quelqu'un qui garde un secret.",
        scene:
          "A cosy bedroom at night lit by a warm bedside lamp: {parent} (seen from behind, face not shown) places a big old leather-bound adventure book on the bed; a small worn leather travel notebook peeks out from between its pages; {prenom}, sitting up in bed, looks at it with curiosity; no other characters.",
        presents: [],
      },
      {
        texte:
          "Chapitre 2 — Une ligne dans le carnet\n{prenom} ouvrit le carnet. Sur la première page, d'une écriture ancienne : « Écris où tu veux aller. » {prenom} prit un crayon et écrivit : « Je pars avec Phileas Fogg. » Les lettres se mirent à briller. Le lit disparut, la lampe aussi. Une odeur de pluie et de charbon remplaça tout le reste. {prenom} se tenait debout dans une rue de Londres, en 1872, le carnet serré contre la poitrine.",
        scene:
          "A foggy London street in 1872 at dusk: gas lamps glowing, horse-drawn carriages, brick houses; {prenom} stands in the middle of the pavement in a dark blue sweater, beige trousers and brown boots, holding a small worn leather travel notebook against the chest, amazed; passers-by far in the background, faces not detailed; no letters on shop signs.",
        presents: [],
      },
      {
        texte:
          "Chapitre 3 — Le pari de Phileas Fogg\nDans un club tout en velours, un homme très calme regardait sa montre. C'était Phileas Fogg. « Je parie vingt mille livres que je ferai le tour du monde en quatre-vingts jours », annonça-t-il. Tout le monde éclata de rire. Lui ne riait pas. Son domestique, Passepartout, attrapait déjà les valises. Fogg remarqua {prenom} et le carnet. « Vous venez ? Le train part à huit heures quarante-cinq. Pas une minute de plus. »",
        scene:
          "Inside an elegant Victorian gentlemen's club with red velvet armchairs: Phileas Fogg (tall slim English gentleman, black top hat, dark grey frock coat) stands calmly, looking at his silver pocket watch; next to him, Passepartout (cheerful round-faced Frenchman, red waistcoat) grabs two suitcases; {prenom} stands near them holding the leather notebook; warm lamplight; nobody else in the room, the armchairs are empty; no letters anywhere.",
        presents: ["Phileas Fogg", "Passepartout"],
      },
      {
        texte:
          "Chapitre 4 — Un drôle de policier\nSur le paquebot qui filait vers l'Égypte, {prenom} remarqua un homme à moustache caché derrière un journal tenu à l'envers. Il les suivait partout. « C'est l'inspecteur Fix, chuchota Passepartout. Il croit que Monsieur Fogg a volé une banque ! » {prenom} nota dans un coin de sa tête : un inspecteur, une moustache, un journal à l'envers. Chaque soir, {prenom} traçait un petit trait au dos du carnet, pour compter les jours. La mer brillait comme une route sans fin.",
        scene:
          "On the deck of a Victorian steamship crossing a sparkling sea: {prenom} leans on the railing next to Passepartout (round-faced Frenchman, red waistcoat), both glancing at Inspector Fix (thin man, bowler hat, big moustache, long brown overcoat) who hides comically behind an upside-down newspaper with no letters on it; sunny day; seagulls.",
        presents: ["Passepartout", "Fix"],
      },
      {
        texte:
          "Chapitre 5 — La voie ferrée s'arrête\nEn Inde, le train s'arrêta brusquement au milieu de la jungle. Les rails s'arrêtaient là, tout simplement. « Il manque cinquante miles de voie », expliqua le conducteur. Les voyageurs râlaient, s'éventaient, abandonnaient. Phileas Fogg sortit sa montre, la regarda, la rangea. « Bien. Nous trouverons un autre moyen. » {prenom} admira son calme. Mais dans la jungle, il n'y avait ni route ni cheval.",
        scene:
          "In the Indian jungle in 1872: a steam train stopped where the railway tracks suddenly end among tall trees and vines; Phileas Fogg (tall gentleman, black top hat, grey frock coat) checks his silver pocket watch, perfectly calm; {prenom} stands next to him holding the leather notebook, looking at the end of the rails; lush green light.",
        presents: ["Phileas Fogg"],
      },
      {
        texte:
          "Chapitre 6 — L'éléphant qui boitait\nDerrière un village, ils trouvèrent un éléphant immense, couvert d'une couverture brodée. Il s'appelait Kiouni. Mais il boitait, et personne n'osait l'approcher. {prenom} s'avança doucement, la main tendue. Dans la patte de Kiouni, une grosse épine était plantée. {prenom} la retira d'un coup sec. L'éléphant souffla, puis enroula sa trompe autour de son bras, comme pour dire merci. Il voulait bien les porter.",
        scene:
          "At the edge of an Indian village: Kiouni, a huge gentle Indian elephant with a colourful embroidered blanket on its back, lifts one front foot; {prenom} kneels beside the foot, carefully pulling out a big thorn; the elephant's trunk gently curls around {prenom}'s arm; warm golden afternoon light; no other characters.",
        presents: ["Kiouni"],
      },
      {
        texte:
          "Chapitre 7 — Le fleuve en colère\nAprès deux jours de jungle, un fleuve gonflé par la pluie leur barra la route. Le pont avait été emporté. Kiouni recula en barrissant. Phileas Fogg regarda sa montre. Alors {prenom} ouvrit le carnet et écrivit sa deuxième ligne : « Un pont de lianes, solide comme le fer. » Sur l'eau, des lianes se tressèrent toutes seules, un peu tordues, mais bien solides. Kiouni posa une patte, puis une autre.",
        scene:
          "A wide swollen jungle river after the rain: a crooked bridge of braided vines, glowing faintly golden as it has just become real, stretches across the water; Kiouni (huge gentle elephant with a colourful embroidered blanket) carefully steps onto it; {prenom} sits on Kiouni's back holding the open leather notebook, Phileas Fogg (black top hat, grey frock coat) seated behind; dramatic but hopeful light.",
        presents: ["Kiouni", "Phileas Fogg"],
      },
      {
        texte:
          "Chapitre 8 — Passepartout a disparu\nÀ Hong Kong, la veille du départ, Passepartout disparut. Le paquebot partait à l'aube. {prenom} réfléchit : la veille, l'inspecteur Fix avait offert à Passepartout un thé très fort, un thé qui fait dormir. Le journal à l'envers, la moustache… {prenom} suivit l'odeur du thé jusqu'à une petite maison du port. Passepartout ronflait sur un banc. {prenom} le secoua, et ils coururent jusqu'au quai, juste à temps.",
        scene:
          "A lantern-lit harbour street of old Hong Kong at night: {prenom} pulls a sleepy Passepartout (round-faced Frenchman, red waistcoat) by the arm toward the docks where a steamship waits; Inspector Fix (bowler hat, big moustache, brown overcoat) peeks out of a tea house doorway, annoyed; red paper lanterns; no letters or characters on signs.",
        presents: ["Passepartout", "Fix"],
      },
      {
        texte:
          "Chapitre 9 — La tempête du Pacifique\nAu milieu du Pacifique, une tempête secoua le navire. Les vagues montaient plus haut que les mâts. Le capitaine voulait faire demi-tour. « Impossible, dit Fogg. Nous perdrions trois jours. » {prenom} sentait le carnet trembler dans sa poche. {Il} écrivit sa troisième ligne : « Les voiles tiennent jusqu'au matin. » Toute la nuit, le vent hurla. Mais au lever du soleil, les voiles étaient toujours là.",
        scene:
          "A Victorian steamship with sails in a stormy Pacific Ocean: huge waves, dark clouds, a little glowing light around the sails that hold firm; on the deck, {prenom} holds onto a rope with one hand and the leather notebook with the other; Phileas Fogg (black top hat, grey frock coat) stands steady at the railing; dramatic, but not frightening.",
        presents: ["Phileas Fogg"],
      },
      {
        texte:
          "Chapitre 10 — Le traîneau à voile\nEn Amérique, la neige bloqua le train au milieu des grandes plaines. Un homme proposa un drôle d'engin : un traîneau avec une voile, qui glissait sur la neige comme un bateau. Personne n'y croyait. « Moi, j'y crois », dit {prenom}. Le vent gonfla la voile. Le traîneau fila à travers la plaine blanche si vite que Passepartout dut tenir son chapeau à deux mains en criant de joie. Ce soir-là, {prenom} traça encore un trait au dos du carnet.",
        scene:
          "A snowy American prairie in winter: a wooden sledge with a big white sail glides at full speed over the snow; {prenom} sits at the front, laughing, hair in the wind; Passepartout (round-faced Frenchman, red waistcoat) holds his hat with both hands behind; Phileas Fogg (black top hat) sits calmly at the back; nobody else on the sledge or in the picture; sparkling snow and blue sky.",
        presents: ["Passepartout", "Phileas Fogg"],
      },
      {
        texte:
          "Chapitre 11 — Cinq minutes de trop\nÀ Londres, le dernier train arriva avec cinq minutes de retard. Quatre-vingts jours, et cinq minutes de trop. L'inspecteur Fix arrêta même Phileas Fogg, avant de découvrir que le vrai voleur avait été pris depuis longtemps. Trop tard. Fogg rentra chez lui sans un mot. Passepartout pleurait. {prenom} regarda son carnet. Il n'y restait qu'une seule ligne, la toute dernière.",
        scene:
          "A rainy London evening in 1872: Phileas Fogg (black top hat, grey frock coat) walks slowly away under the rain, shoulders low; Passepartout (red waistcoat) wipes a tear; {prenom} stands on the wet pavement, looking down at the open leather notebook; gas lamps glowing; melancholic but gentle; no letters anywhere.",
        presents: ["Phileas Fogg", "Passepartout"],
      },
      {
        texte:
          "Chapitre 12 — Le jour gagné\nAlors {prenom} compta les petits traits au dos du carnet, un par soir. Il y en avait un de plus que de jours passés au calendrier ! En voyageant vers l'est, ils avaient gagné une journée entière. Ce n'était pas le dernier jour : c'était l'avant-dernier ! {prenom} courut chez Fogg. « Monsieur, nous sommes en avance ! » Ils foncèrent au club. Il restait une seconde quand Phileas Fogg poussa la porte.",
        scene:
          "Inside the velvet gentlemen's club: Phileas Fogg (tall gentleman, black top hat, grey frock coat) bursts through the door, perfectly calm, holding his silver pocket watch; {prenom} right behind him, out of breath, holding up the open leather notebook with a huge smile; Passepartout (red waistcoat) cheering; a big round wall clock (no numbers, only hands) shows the very last second; golden light.",
        presents: ["Phileas Fogg", "Passepartout"],
      },
      {
        texte:
          "Chapitre 13 — Le billet de 1872\n{prenom} se réveilla dans son lit, le carnet sur la poitrine. Entre deux pages, il y avait un vieux billet de train, daté de 1872. {parent} entra. « Alors, tu sais comment Fogg a gagné son pari ? » {prenom} sourit. « Grâce à un jour gagné en voyageant vers l'est. » Puis {il} montra la dernière ligne du carnet, qui n'avait pas servi. « Et celle-là, je la garde pour le prochain livre. »",
        scene:
          "Morning in the cosy bedroom: {prenom} sits in bed holding an old yellowed train ticket and the small leather notebook, smiling; the big leather-bound adventure book lies on the duvet; {parent} (seen from behind, face not shown) at the door; soft morning light; no letters on the ticket.",
        presents: [],
      },
    ],
    passages: {},
  },
];

/** L'histoire maîtresse d'un thème, si elle existe pour cet âge. */
/**
 * Le Club comprend seulement les histoires toutes prêtes (peu coûteuses à
 * fabriquer). Un livre sur mesure n'est jamais compris, même s'il reste des
 * livres au membre ce mois-ci.
 */
export function livreInclusClub(
  abonnement: { actif: boolean; restants: number },
  mode: "theme" | "libre" | string,
  themeId: string | undefined,
  age: number,
): boolean {
  return abonnement.actif && abonnement.restants > 0 && mode === "theme" && maitressePour(themeId, age) !== null;
}

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
  const de = elision(p.prenom) ? "d'" : "de ";
  return texte
    .replace(/\[\[(\w+)\]\]/g, (_, cle: string) => p.passages[cle] ?? h.passages[cle]?.defaut ?? "")
    .replaceAll("{de_prenom}", `${de}${p.prenom}`)
    .replaceAll("{prenom}", p.prenom)
    .replaceAll("{Il}", p.fille ? "Elle" : "Il")
    .replaceAll("{il}", p.fille ? "elle" : "il")
    // Doudou sans nom : « son lapin » partout (et « son doudou » si l'enfant n'en a pas décrit).
    .replaceAll("{son_doudou} {doudou}", nomme ? `${p.sonDoudou} ${nomme}` : p.sonDoudou)
    .replaceAll("{de_doudou}", nomme ? `${elision(nomme) ? "d'" : "de "}${nomme}` : `de ${p.sonDoudou}`)
    .replaceAll("{son_doudou}", p.sonDoudou)
    .replaceAll("{doudou}", nomme || p.sonDoudou)
    .replaceAll("{parent}", p.parent)
    .replaceAll("{dit_parent}", feminin ? "dit-elle" : "dit-il")
    .replaceAll("{petit_parent}", feminin ? "petite" : "petit")
    // Doudou sans nom en début de phrase : « Son doudou était là », pas « son doudou ».
    .replace(/(^|[.!?…]\s+|«\s)(son|sa) /g, (_, avant: string, mot: string) => `${avant}${mot[0]!.toUpperCase()}${mot.slice(1)} `);
}

/** Sans accents ni majuscules, pour comparer deux prénoms. */
const normal = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** L'histoire, avec ses personnages renommés si l'un porte le prénom de l'enfant (« Malo aide Malo »). */
export function adapterNoms(h: HistoireMaitresse, prenom: string): HistoireMaitresse {
  const doublons = Object.entries(h.remplacants ?? {}).filter(([nom]) => normal(nom) === normal(prenom));
  if (!doublons.length) return h;
  let json = JSON.stringify(h);
  for (const [nom, autre] of doublons) json = json.replaceAll(nom, autre);
  return JSON.parse(json) as HistoireMaitresse;
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
  // La comparaison du caillou ne parle jamais de sa taille (il est minuscule).
  if (cle === "comparaison" && /\b(gros|grosse|grand|grande|énorme|immense|géant|géante)\b/i.test(t)) return false;
  // Même début que le texte par défaut (« rond comme », « Il sortit »…) : la phrase s'insère sans couture.
  const debut = def.defaut.split(/\s+/).slice(0, 2).join(" ").toLowerCase();
  const debutAlt = cle === "comparaison" ? ["rond comme", "doux comme", "ronde comme"] : [debut];
  return debutAlt.some((d) => t.toLowerCase().startsWith(d)) || t.toLowerCase().startsWith(debut);
}
