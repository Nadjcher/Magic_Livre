/**
 * Bibliothèque de départ du RAG d'écriture : extraits modèles (le TON) et
 * trames (la STRUCTURE). Textes originaux écrits pour Encore une histoire ;
 * les trames reprennent des structures de contes du domaine public
 * (contes populaires, Perrault, Grimm, La Fontaine), jamais leur texte.
 *
 * Chargée dans la base au premier usage ; ensuite, la bibliothèque s'enrichit
 * depuis /admin/histoires (histoires validées, extraits ajoutés à la main).
 * Les pages d'un extrait sont séparées par une ligne vide.
 */

export type TypeExemple = "extrait" | "trame";
export type Ton = "tendre" | "drole" | "feerique" | "aventure" | "mystere" | "comptine";

export interface ExempleDepart {
  cle: string;
  type: TypeExemple;
  titre: string;
  ageMin: number;
  ageMax: number;
  tons: Ton[];
  /** Types de livre (ids de bookFormats) ; vide = tous. */
  formats: string[];
  /** Catégories ou ids de thèmes ; vide = tous. */
  themes: string[];
  texte: string;
}

/** Modèles de départ retirés (désactivés en base au démarrage). */
export const DEPART_RETIRES = ["trame-conte-petit-poucet"];

export const BIBLIOTHEQUE_DEPART: ExempleDepart[] = [
  // ─── 1 à 3 ans ───
  {
    cle: "comptine-nounours",
    type: "extrait",
    titre: "Où est Nounours ?",
    ageMin: 1,
    ageMax: 3,
    tons: ["comptine", "tendre"],
    formats: ["comptine", "imagier", "dodo"],
    themes: [],
    texte: `Petit Lou met ses chaussons,
un, deux, trois, tout ronds, tout ronds.

Petit Lou cherche Nounours :
sous le lit ? Non. Dans la trousse ? Non !

Petit Lou entend : « Atchoum ! »
C'est Nounours, sous la couverture… boum !

Petit Lou fait un gros câlin,
Nounours aussi. Bonne nuit, à demain.`,
  },
  {
    cle: "pluie-tip-tap",
    type: "extrait",
    titre: "Tip, tap, la pluie",
    ageMin: 1,
    ageMax: 3,
    tons: ["tendre", "comptine"],
    formats: ["dodo", "imagier", "album"],
    themes: ["emotions"],
    texte: `Tip, tap, tip, tap : c'est la pluie sur la fenêtre.
Maé pose son doigt sur la vitre. Froid !

Tip, tap : deux gouttes font la course.
« Allez, la petite ! » dit Maé.

La petite goutte gagne. Clap, clap, clap !

Tip… tap… La pluie chuchote. Maé bâille.
Chut. La pluie aussi va dormir.`,
  },
  {
    cle: "chapeau-papa",
    type: "extrait",
    titre: "Le chapeau de Papa",
    ageMin: 1,
    ageMax: 3,
    tons: ["drole"],
    formats: ["imagier", "album", "drole"],
    themes: [],
    texte: `Où est passé le chapeau de Papa ?

Sur la tête du chien ? Non ! Le chien porte une chaussette.

Sur la tête du chat ? Non ! Le chat porte un bol.

Sur la tête du poisson ? Non ! Le poisson porte… une bulle.

Il est sur la tête de Nino ! Et Nino rit, rit, rit.`,
  },
  {
    cle: "etoile-bac-a-sable",
    type: "extrait",
    titre: "L'étoile du bac à sable",
    ageMin: 2,
    ageMax: 4,
    tons: ["feerique", "tendre"],
    formats: ["dodo", "album", "comptine"],
    themes: ["aventures", "fetes"],
    texte: `Une étoile est tombée dans le jardin,
toute petite, au fond du bac à sable.

Sami la prend dans sa main.
Elle est tiède. Elle chatouille.

« Tu as perdu ta maison ? »
L'étoile clignote : oui.

Sami souffle très doucement : fffffff…
L'étoile remonte, remonte, remonte.

Là-haut, elle cligne trois fois.
C'est sa façon de dire merci.`,
  },
  // ─── 3 à 5 ans ───
  {
    cle: "ours-portemanteau",
    type: "extrait",
    titre: "L'ours du portemanteau",
    ageMin: 3,
    ageMax: 5,
    tons: ["tendre", "drole"],
    formats: ["album", "dodo"],
    themes: ["emotions", "peur-du-noir", "grand-lit"],
    texte: `Ce soir, l'ombre du portemanteau ressemble à un ours. Un très grand ours, avec un chapeau.

Lou remonte la couverture jusqu'au nez. « Papa ! Il y a un ours ! »

Papa allume la lampe. L'ours devient un manteau, une écharpe et le chapeau de pluie.

« Il a l'air fatigué, ton ours, dit Papa. Il a porté mon manteau toute la journée. »

Quand la lumière s'éteint, Lou chuchote : « Bonne nuit, l'ours. Tu peux enlever ton chapeau. »`,
  },
  {
    cle: "oeuf-carre",
    type: "extrait",
    titre: "L'œuf carré",
    ageMin: 3,
    ageMax: 6,
    tons: ["drole"],
    formats: ["album", "drole"],
    themes: ["passions", "paques", "animal"],
    texte: `Ce matin, la poule Gertrude a pondu un œuf carré.

« Carré ? » s'étonne le fermier. « Carré ! » caquette Gertrude, très fière d'elle.

L'œuf ne roule pas. Il ne tombe pas de la table. Il tient debout tout seul, comme un petit cube.

Tous les poussins viennent le voir. Ils grimpent dessus et jouent au roi de la montagne.

Le lendemain, Gertrude réfléchit très fort, ferme les yeux… et pond un œuf en forme d'étoile.`,
  },
  {
    cle: "voiture-rouge",
    type: "extrait",
    titre: "La voiture rouge",
    ageMin: 3,
    ageMax: 5,
    tons: ["drole", "aventure"],
    formats: ["album", "cherche"],
    themes: [],
    texte: `Nino a perdu sa petite voiture rouge.

Il demande au chat : « Tu as vu ma voiture ? »
Le chat bâille : « Demande au merle. »

Le merle siffle : « Demande à l'escargot. »

L'escargot met longtemps, très longtemps à répondre :
« Elle… est… sous… mon… toit. »

Sous la grande feuille de rhubarbe, la voiture rouge attend. Avec trois escargots dedans, qui font la course.`,
  },
  {
    cle: "renard-des-nuages",
    type: "extrait",
    titre: "Le renard des nuages",
    ageMin: 2,
    ageMax: 5,
    tons: ["feerique", "tendre"],
    formats: ["dodo", "album"],
    themes: ["emotions", "foret-enchantee"],
    texte: `Chaque soir, quand Sami ferme les yeux, le petit renard des nuages passe devant la fenêtre.

Il porte un panier rempli de rêves, ronds comme des billes.

« Lequel tu veux ce soir ? demande le renard. Le bleu, avec la plage ? Le jaune, avec le gâteau ? »

Sami réfléchit. « Le bleu… mais avec un peu de gâteau. »

Le renard rit tout bas, mélange les deux billes et souffle dessus. Bonne nuit, Sami.`,
  },
  // ─── 5 à 7 ans ───
  {
    cle: "porte-dans-le-sable",
    type: "extrait",
    titre: "La porte dans le sable",
    ageMin: 5,
    ageMax: 8,
    tons: ["aventure", "drole", "feerique"],
    formats: ["album", "aventure"],
    themes: ["aventures", "ocean"],
    texte: `Le jour où la mer se retira plus loin que d'habitude, Maé découvrit une porte au milieu du sable. Une vraie porte, en bois bleu, avec une poignée en coquillage.

Elle frappa trois fois. De l'autre côté, une petite voix demanda : « C'est pour la livraison ? »

« Quelle livraison ? » répondit Maé.

La porte s'entrouvrit sur un crabe en tablier, l'air très pressé. « Les vagues ! Il en manque une douzaine pour la marée de ce soir, et le livreur est encore en retard ! »`,
  },
  {
    cle: "dragon-bibliotheque",
    type: "extrait",
    titre: "Le dragon qui ne riait plus",
    ageMin: 5,
    ageMax: 8,
    tons: ["drole", "tendre"],
    formats: ["album", "drole", "aventure"],
    themes: ["aventures", "chevaliers", "emotions"],
    texte: `Le dragon de la bibliothèque avait un problème : chaque fois qu'il riait, il roussissait une page.

Alors il ne riait plus. Jamais. Même pas aux histoires de pirates qui tombent à l'eau.

Sami, qui venait tous les mercredis, remarqua que le dragon se mordait les joues.
« Tu as mal aux dents ?
— Non, souffla le dragon, les mâchoires serrées. J'ai envie de rire. »

Le mercredi suivant, Sami arriva avec un seau d'eau, un parapluie et un livre de blagues.`,
  },
  {
    cle: "caillou-rentree",
    type: "extrait",
    titre: "Le caillou de la rentrée",
    ageMin: 4,
    ageMax: 7,
    tons: ["tendre", "drole"],
    formats: ["album", "realiste"],
    themes: ["grandir", "rentree", "timidite", "emotions"],
    texte: `La veille de la rentrée, Lou glissa un caillou dans sa poche. Un caillou lisse et gris, ramassé au bord de la rivière avec Maman.
« Comme ça, si j'ai peur, je le serre », expliqua-t-elle.

Le lendemain, dans la cour, tout était trop grand : les arbres, les cris, les cartables des autres.

Lou serra le caillou. Il était tiède, comme une main.

À côté d'elle, un garçon serrait quelque chose dans sa poche, lui aussi.
« Toi aussi, tu as un caillou ? demanda Lou.
— Non, dit le garçon. Un bouchon de stylo. Mais ça marche pareil. »`,
  },
  {
    cle: "pommier-lanternes",
    type: "extrait",
    titre: "Le pommier aux lanternes",
    ageMin: 4,
    ageMax: 8,
    tons: ["feerique", "mystere"],
    formats: ["album", "dodo", "aventure"],
    themes: ["foret-enchantee", "aventures"],
    texte: `Au fond du jardin de Mamie poussait un pommier qui ne donnait pas de pommes, mais des lanternes.

Elles s'allumaient une à une quand le soleil se couchait, avec un petit bruit de bulle : pop, pop, pop.

Nino avait le droit d'en cueillir une seule par soir. Il la posait sur sa table de nuit, et elle éclairait ses rêves d'une lueur orangée.

Mais ce soir-là, en tendant la main, Nino entendit une lanterne tousser.`,
  },
  // ─── 7 à 9 ans ───
  {
    cle: "voleur-mots-croises",
    type: "extrait",
    titre: "Le voleur de mots croisés",
    ageMin: 7,
    ageMax: 10,
    tons: ["mystere", "drole"],
    formats: ["enquete", "roman"],
    themes: [],
    texte: `Depuis lundi, quelqu'un volait les mots croisés du journal de Monsieur Ferrand. Pas le journal : seulement la grille, découpée bien proprement aux ciseaux.

« Un voleur qui aime les mots croisés, résuma Sami. Ça réduit le nombre de suspects. »

Il ouvrit son carnet et écrivit trois noms : la gardienne, le facteur, et Pistache, le perroquet du troisième étage.

« Un perroquet ne sait pas tenir des ciseaux, objecta sa sœur.
— Justement, dit Sami. C'est ce que tout le monde pense. »`,
  },
  {
    cle: "fusee-hoquet",
    type: "extrait",
    titre: "La fusée qui avait le hoquet",
    ageMin: 6,
    ageMax: 9,
    tons: ["drole", "aventure"],
    formats: ["aventure", "drole", "scifi"],
    themes: ["espace", "aventures"],
    texte: `La fusée de Maé n'avait qu'un défaut : elle avait le hoquet. À chaque hic, elle faisait un bond de trois cents kilomètres sur le côté.

« Hic ! » Et la Lune passait à gauche. « Hic ! » Et la Lune repassait à droite.

« On n'arrivera jamais, soupira Grumo, le robot copilote, en se tenant la tête. Mes circuits ont le mal de mer. »

Maé fouilla dans la boîte à gants. Il y avait des biscuits, une lampe de poche et le vieux cahier de recettes de sa grand-mère. Page 43 : « Hoquet tenace. Faire très peur au malade. »`,
  },
  {
    cle: "tour-de-cartes",
    type: "extrait",
    titre: "La tour de cartes",
    ageMin: 6,
    ageMax: 10,
    tons: ["tendre"],
    formats: ["album", "realiste"],
    themes: ["emotions", "colere", "partage", "petit-frere"],
    texte: `Quand Nino se mettait en colère, il sentait monter quelque chose de chaud, depuis les orteils jusqu'aux oreilles, comme du lait qui déborde de la casserole.

Ce jour-là, sa tour de cartes s'écroula à cause de sa petite sœur, et le lait déborda d'un coup. Il cria si fort que le chat quitta la pièce.

Ensuite, il y eut ce silence bizarre qui suit les cris, celui où tout le monde regarde ses chaussures.

Sa sœur ramassa une carte. Puis une autre. Elle les lui tendit sans rien dire, la lèvre qui tremblait.

Nino prit les cartes. Il ne savait pas encore quoi dire, alors il commença par construire, à côté de la sienne, une deuxième tour, un peu plus petite.`,
  },
  // ─── 9 à 12 ans ───
  {
    cle: "plan-tapisserie",
    type: "extrait",
    titre: "Le plan sous la tapisserie",
    ageMin: 9,
    ageMax: 12,
    tons: ["mystere", "aventure"],
    formats: ["roman", "fantasy", "enquete"],
    themes: ["aventures", "demenagement"],
    texte: `Chapitre 1 — Le plan sous la tapisserie

On ne quitte pas un vieux manoir sans en connaître tous les secrets : c'était la règle d'Alma, et elle n'avait plus que quatre jours pour l'appliquer, car le déménagement avait lieu samedi.

Elle avait déjà trouvé un escalier de service, deux cachettes à chocolat et une lettre d'amour de 1952. Il ne restait que la tapisserie du salon, celle où des chasseurs poursuivaient un cerf depuis trois cents ans sans jamais l'attraper.

En la décrochant pour les déménageurs, elle sentit sous ses doigts un papier plié, cousu dans la doublure. C'était un plan de la maison, mais avec une pièce en plus. Une pièce qui n'existait pas.

En bas, une écriture penchée avait ajouté : « Pour qui saura écouter le parquet. »`,
  },
  {
    cle: "jumeaux-desserts",
    type: "extrait",
    titre: "Dix-neuf desserts",
    ageMin: 9,
    ageMax: 12,
    tons: ["drole"],
    formats: ["roman", "drole", "realiste"],
    themes: [],
    texte: `Le problème, avec un frère jumeau, c'est qu'on se fait punir deux fois : une fois pour ses propres bêtises, une fois pour celles de l'autre.

Théo avait fait le calcul. Sur l'année, il avait été privé de dessert quarante-trois fois, dont dix-neuf pour des crimes commis par Lucien. Il en avait fait un tableau, avec des colonnes et des couleurs.

« C'est de la statistique, expliqua-t-il à ses parents. Je demande le remboursement de dix-neuf desserts. »

Son père examina le tableau avec beaucoup de sérieux, puis le retourna. Au dos, Lucien avait dressé son propre tableau. Il réclamait vingt-sept desserts.`,
  },
  {
    cle: "canne-grand-pere",
    type: "extrait",
    titre: "Les trois coups de la canne",
    ageMin: 8,
    ageMax: 12,
    tons: ["tendre"],
    formats: ["album", "roman", "realiste"],
    themes: ["emotions", "famille"],
    texte: `Grand-père ne parlait plus beaucoup depuis l'hiver, alors Inaya avait inventé un système : elle lui posait des questions, et il répondait avec sa canne.

Un coup pour oui. Deux coups pour non. Trois coups pour « ça dépend ». Et un long frottement sur le parquet pour « raconte-moi encore ».

Ce soir-là, elle lui demanda s'il avait déjà vu la mer quand il était petit.

La canne resta immobile un long moment. Puis elle frappa trois coups.

« Ça dépend ? répéta Inaya. Comment ça peut dépendre ? »

Alors Grand-père sourit et, pour la première fois depuis des semaines, il ouvrit la bouche pour raconter.`,
  },
  // ─── Histoires validées (banc d'essai du 11 novembre, classées 1re et 2e) ───
  {
    cle: "validee-volcan-de-poche",
    type: "extrait",
    titre: "Le volcan de poche",
    ageMin: 8,
    ageMax: 12,
    tons: ["drole", "tendre"],
    formats: ["album", "roman", "realiste"],
    themes: ["emotions", "colere"],
    texte: `« Ce volcan, c'est ta colère, expliqua Cendrine en époussetant sa queue. Il pousse quand une chose injuste reste coincée quelque part. Les gens croient que c'est dans la gorge. Moi, je dirais plutôt entre le ventre et les oreilles. » Maé regarda le volcan cracher une nouvelle étincelle. Elle n'avait aucune envie qu'il grandisse. Elle attrapa le verre vide sur sa table de chevet et le retourna d'un coup sur le cratère, comme on attrape une araignée. « Voilà. Enfermé. » Cendrine ouvrit la bouche pour dire quelque chose. Puis elle la referma, ce qui, chez elle, n'arrivait presque jamais.

Sous le verre, la fumée tourna, tourna, de plus en plus épaisse. Le verre se mit à trembler, puis à tinter contre le bois. Ting, ting, ting. Le volcan avait déjà la taille d'un melon. Avec un « plop » de bouchon, le verre sauta et roula sur le tapis, et une pluie d'étincelles retomba sur la couette sans la brûler. Maé sentit ses joues chauffer encore plus. « Une colère qu'on enferme, elle grossit en cachette, soupira Cendrine. Répète avec moi, c'est une vieille formule de gardienne : “Gronde, petit volcan, mais pas plus haut que moi.” » Maé la répéta du bout des lèvres. Ça ressemblait plus à une prière qu'à une formule.

« On essaie la méthode de la soupe ? proposa Cendrine. Quand une soupe est trop chaude, on ne crie pas dessus. On souffle. » Maé s'assit en tailleur face au volcan. Elle inspira par le nez, longtemps, en comptant jusqu'à quatre, puis elle souffla doucement vers le cratère, comme sur une bougie qu'on ne veut pas éteindre. Une fois. Deux fois. Dix fois. La fumée devint plus claire, presque de la brume. Les étincelles s'espacèrent. Le volcan rapetissa jusqu'à la taille d'une théière, puis d'une tasse. Cendrine applaudissait avec ses quatre pattes à la fois, ce qui la fit tomber sur le dos.`,
  },
  {
    cle: "validee-carte-clair-de-lune",
    type: "extrait",
    titre: "La carte au clair de lune",
    ageMin: 5,
    ageMax: 8,
    tons: ["feerique", "drole", "aventure"],
    formats: ["album", "aventure", "dodo"],
    themes: ["aventures", "foret-enchantee"],
    texte: `Au bout du lit, Caramel ouvrit un œil. « Un trésor ? Dehors ? La nuit ? miaula-t-il. Il y a peut-être des loups. Ou des flaques. » Caramel parlait seulement la nuit, et il avait peur de presque tout. Maé le gratta sous le menton. « Je tiens la lampe, toi, tu tiens la carte. »

À pas de chat, ils se glissèrent dans le jardin. La carte montrait d'abord le rosier. Sous une feuille, un ruban d'argent brillait. « Petit sourire, où es-tu caché ? » demanda Maé. Mais ce n'était qu'une trace d'escargot. Caramel fit un bond en arrière : « Il colle, ton trésor ! »

La carte menait ensuite au petit bassin. Tout au fond, sous la mousse, brillait un croissant d'argent. « Petit sourire, où es-tu caché ? » murmura Maé, sans respirer. Caramel tendit une patte tremblante. Plic ! L'eau fit des ronds… Ce n'était qu'une vieille cuillère, couchée dans la vase.

Maé s'assit au bord du bassin et regarda la carte de plus près. Puis elle éclata de rire. Elle la tenait à l'envers ! La croix n'était pas dans le jardin. Elle était dans sa chambre, juste sous son lit. « Tout ce chemin pour rien ? » soupira Caramel.`,
  },
  {
    cle: "trame-conte-petit-poucet-v2",
    type: "trame",
    titre: "Le Petit Poucet · collection « Les contes de papa et maman »",
    ageMin: 4,
    ageMax: 7,
    tons: ["feerique", "tendre", "aventure"],
    formats: [],
    themes: ["petit-poucet", "classiques"],
    texte: `TRAME IMPOSÉE : suis-la case par case, sans ajouter d'autre péripétie. UNE seule idée : {prenom} répare le conte, et sa trace reste dans le livre de {parent}.

Champs
- Ritournelle : « Petit caillou blanc, montre-nous le chemin. »
- Objet clé : {objet_enfant}, et un crayon blanc pris sur la table de nuit.
- Compagnon : le Petit Poucet, malin mais trop fier pour demander de l'aide.
- Fiche visuelle FIXE de Poucet (à reprendre telle quelle dans "cast", identique dans tous les livres) : « POUCET: a tiny cheerful boy as tall as a boot (his head reaches the child's knee), straight BLACK hair, a red knitted bonnet, a brown wool jacket, patched trousers, little wooden clogs — never curly, never blond, never looking like the hero; ALWAYS this same size on every page ». La taille de Poucet ne change jamais : haut comme une botte, il arrive au genou de l'enfant.
- Le doudou de l'enfant : TOUJOURS nommé par son nom, dessiné exactement comme le parent l'a décrit (son espèce et sa couleur bien reconnaissables : oreilles, museau, pattes), doux et mignon, jamais une boule informe, jamais vivant.
- Émotion de départ : inquiet(e) pour Poucet. Émotion d'arrivée : fier(e).
- Accroche de suite : à la page suivante du livre, une botte dépasse d'un buisson.

Les neuf cases
1. Le soir ordinaire. {parent} ouvre le vieux livre de contes de son enfance. {prenom} est au lit avec {objet_enfant}.
2. Le petit problème. À la page de la forêt, les cailloux blancs ont disparu du dessin. Sans eux, Poucet et ses frères ne rentreront pas.
3. L'appel. {parent} sort un instant. Un seul caillou blanc luit sur la page. {prenom} le touche, le crayon blanc à la main, et entre dans la forêt dessinée.
4. La rencontre. Poucet, haut comme une botte, cherche ses cailloux partout. Ils se sont effacés, il ne sait pas pourquoi. Il refuse l'aide : « Je trouve toujours le chemin. » Au loin, un ronflement énorme : le géant dort. Le bord de la page s'assombrit.
5. Premier essai, raté. Poucet sème des miettes de pain. Les oiseaux mangent tout. La ritournelle, dite par Poucet. La page s'assombrit encore.
6. Deuxième essai, presque. {prenom} pose son unique caillou par terre. Il brille, mais un seul caillou ne fait pas un chemin. La ritournelle, dite par {prenom}. Le ronflement s'arrête un instant, puis reprend.
7. Troisième essai, l'idée de l'enfant. {prenom} regarde son crayon blanc, puis le sol de papier. Il/elle dessine un caillou. Il devient vrai. Poucet demande enfin : « Tu m'en dessines un autre ? » {prenom} dessine, Poucet montre où aller. La ritournelle, dite à deux.
8. La résolution. Le chemin de cailloux tordus mène à la maison de Poucet, fenêtre allumée. Les frères courent. Poucet garde un caillou dessiné dans sa poche. La page redevient claire.
9. Le retour au lit. {prenom} est dans son lit. {parent} revient et regarde la page : les cailloux sont là, un peu tordus. « Ils sont encore plus beaux qu'avant. » Dernière image : la botte qui dépasse du buisson, page suivante.

Consignes propres à cette trame
- Le géant n'apparaît jamais. On entend seulement son ronflement.
- Aucun abandon par les parents : les frères se sont perdus en ramassant du bois.
- L'idée des cailloux reste celle de Poucet. {prenom} répare le chemin, il/elle n'invente pas le conte.
- La magie a une seule règle : ce qu'on dessine au crayon blanc dans le livre devient vrai. Rien d'autre n'apparaît tout seul.
- Aucune phrase de morale. Poucet ne dit pas ce qu'il a appris, il demande de l'aide, c'est tout.
- {parent} ne dit pas qu'il comprend ce qui s'est passé.
- 450 à 550 mots, 10 pages.

Style visuel : celui du livre (3D, un seul rendu cohérent). La forêt du conte est une forêt de livre d'images en 3D, douce et lumineuse : JAMAIS de décor dessiné au crayon gris, jamais de mélange 3D et dessin. Ce que l'enfant dessine au crayon blanc se distingue toujours du décor (traits blancs maladroits d'un enfant de 5 ans, de tailles inégales, jamais un pavage ni une route propre).
Les scene_illustration décrivent seulement ce qu'on voit (lieu, personnages, objets, lumière) : jamais de consigne d'expression du visage, et rien de tout cela ne doit apparaître dans le texte de l'histoire.`,
  },
  // ─── Trames (structures) ───
  {
    cle: "trame-randonnee",
    type: "trame",
    titre: "Le conte en randonnée",
    ageMin: 1,
    ageMax: 6,
    tons: ["drole", "comptine"],
    formats: [],
    themes: [],
    texte:
      "Structure des contes populaires en randonnée (comme « Roule galette ») : le héros part avec un but simple et rencontre l'un après l'autre 3 à 5 personnages. Chaque rencontre reprend la même ritournelle, qui s'allonge d'un élément. La dernière rencontre renverse la situation de façon drôle ou tendre. Fin en boucle, qui fait écho au début.",
  },
  {
    cle: "trame-trois-epreuves",
    type: "trame",
    titre: "Les trois épreuves",
    ageMin: 5,
    ageMax: 12,
    tons: ["aventure", "feerique"],
    formats: [],
    themes: ["aventures", "classiques"],
    texte:
      "Structure des contes de Perrault et Grimm : un désir clair, trois tentatives de plus en plus difficiles. Les deux premières échouent mais apprennent quelque chose au héros, ou lui font aider quelqu'un. La troisième réussit grâce à ce qu'il a appris ou grâce à celui qu'il a aidé. La victoire vient d'une idée du héros, jamais d'un hasard.",
  },
  {
    cle: "trame-fable",
    type: "trame",
    titre: "La fable retournée",
    ageMin: 5,
    ageMax: 10,
    tons: ["drole"],
    formats: [],
    themes: [],
    texte:
      "Structure des fables de La Fontaine : deux personnages que tout oppose (rapide et lent, grand et petit, vantard et discret). Le plus faible gagne par une ruse simple et visible. Pas de morale énoncée : la chute suffit, et l'enfant la comprend tout seul.",
  },
  {
    cle: "trame-monde-envers",
    type: "trame",
    titre: "Le monde à l'envers",
    ageMin: 4,
    ageMax: 10,
    tons: ["drole", "feerique"],
    formats: [],
    themes: [],
    texte:
      "Une règle du quotidien s'inverse un matin (la pluie monte au lieu de tomber, les parents vont à l'école). Le héros comprend la nouvelle règle avant les autres et s'en sert pour régler un vrai problème. Retour à la normale le soir, avec un petit objet qui prouve que tout était vrai.",
  },
  {
    cle: "trame-objet-perdu",
    type: "trame",
    titre: "L'objet perdu",
    ageMin: 3,
    ageMax: 9,
    tons: ["mystere", "tendre"],
    formats: [],
    themes: [],
    texte:
      "Enquête douce : un objet aimé disparaît. Trois indices, deux fausses pistes drôles (on soupçonne le chat, puis le petit frère). La vérité est tendre : l'objet a été emprunté pour une bonne raison, qu'on découvre à la fin.",
  },
  {
    cle: "trame-petit-sauve-grand",
    type: "trame",
    titre: "Le petit qui sauve le grand",
    ageMin: 3,
    ageMax: 8,
    tons: ["tendre", "drole"],
    formats: [],
    themes: [],
    texte:
      "Un personnage immense (un géant, une baleine, un dragon) a un problème minuscule : une épine, le hoquet, la peur d'une souris. Tout le monde a peur de lui, sauf le héros, qui est petit et qui seul peut l'aider. Ils deviennent amis.",
  },
  {
    cle: "trame-voyage-retour",
    type: "trame",
    titre: "Le voyage et le retour",
    ageMin: 4,
    ageMax: 12,
    tons: ["aventure", "feerique"],
    formats: [],
    themes: ["aventures"],
    texte:
      "Une porte vers un autre monde (une flaque, une armoire, une page). Une mission à accomplir là-bas, un compagnon rencontré en route, un cadeau échangé. Retour au lit au matin, et un détail (le cadeau, du sable dans les chaussons) prouve que ce n'était pas un rêve.",
  },
  {
    cle: "trame-feuilleton",
    type: "trame",
    titre: "L'épisode de feuilleton",
    ageMin: 4,
    ageMax: 12,
    tons: ["aventure"],
    formats: [],
    themes: [],
    texte:
      "Pour une série : une phrase au début rappelle l'épisode précédent. L'épisode a son propre petit problème, résolu à la fin, mais laisse une question ouverte ou un nouvel indice qui donne envie de lire la suite.",
  },
];
