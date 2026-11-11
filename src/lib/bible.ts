/**
 * La bible féerique et la grille de relecture d'Encore une histoire
 * (document « Bible féerique et grille de relecture », 11 nov. 2026).
 * La bible est donnée telle quelle à l'IA autrice ET à l'IA relectrice ;
 * la grille seulement à la relectrice.
 */

export const BIBLE = `LA BIBLE FÉERIQUE D'ENCORE UNE HISTOIRE
Le féerique d'Encore une histoire, c'est le merveilleux qui entre dans le quotidien de l'enfant, jamais un monde lointain où on l'emmène.

Les six règles de ton :
1. Le merveilleux part d'un objet réel de l'enfant : son doudou, sa lampe de chevet, une chaussette perdue.
2. La magie est petite et précise : une lueur sous la porte, pas une explosion de couleurs.
3. On montre, on n'explique pas : aucune phrase du type « il comprit que ».
4. Le texte est écrit pour la voix : phrases courtes, rythme régulier, une ritournelle qui revient trois fois.
5. La peur reste à hauteur d'enfant et se résout toujours avant la dernière page.
6. L'enfant agit : c'est lui qui trouve la solution, ni un adulte ni la magie à sa place.

Le lexique à privilégier :
- Lumière : lueur, éclat, braise, reflet, luciole, clair de lune.
- Sons : murmure, froufrou, tintement, bruissement, clapotis, chuchoter.
- Nature : clairière, mousse, rosée, brume, écorce, sentier.
- Matières : velours, plume, fil d'or, coquille, ruban.
- Mouvements : se faufiler, virevolter, glisser, frémir, avancer sur la pointe des pieds.
Mots à limiter à UNE fois par histoire : magique, incroyable, extraordinaire, merveilleux, soudain.

Les motifs qui signent la marque :
- La petite lumière qui guide, présente dans chaque histoire sous une forme différente.
- Le compagnon au défaut attachant : trop bavard, peureux, distrait.
- L'objet de l'enfant qui devient la clé du problème.
- Le chiffre trois : trois essais, trois rencontres, trois fois la ritournelle.
- La fin dans le lit (ou le retour au calme quand l'histoire se passe le jour) : retour à la chambre, calme, dernière phrase douce.

Les clichés interdits :
- L'ouverture « Il était une fois » et la fin « ils vécurent heureux ».
- La morale écrite en dernière phrase.
- « Tout cela n'était qu'un rêve ».
- L'adulte ou la fée qui règle le problème à la place de l'enfant.
- Plus de deux adjectifs pour un même nom.
- Licornes, arcs-en-ciel et paillettes par défaut : seulement si l'enfant les aime (ou si le thème les demande).
- Le méchant puni ou humilié : on préfère un malentendu ou une peur apprivoisée.
- Les rôles stéréotypés fille ou garçon.`;

/** Règles de longueur par âge (bible). */
export function reglesAge(age: number): string {
  if (age <= 3) return "1 à 3 ans : 80 à 150 mots pour TOUTE l'histoire, phrases de 4 à 8 mots ; rimes, répétitions, onomatopées ; aucun danger.";
  if (age <= 7) return "4 à 7 ans : 40 à 60 mots par page (400 à 600 mots en tout), phrases de 8 à 12 mots ; ritournelle, dialogues, une petite peur résolue.";
  return "8 à 12 ans : 80 à 140 mots par page (900 à 1 400 mots en tout ou par chapitre), longueurs de phrases variées ; humour, vrai enjeu, fin de chapitre ouverte.";
}

/** Le plan d'histoire en neuf cases (rempli par l'autrice avant d'écrire). */
export const PLAN = `LE PLAN D'HISTOIRE (neuf cases, à remplir AVANT d'écrire une seule phrase) :
1. Le moment ordinaire : le lieu, le moment (souvent le soir), l'objet de l'enfant.
2. Le petit problème : une gêne concrète, à hauteur d'enfant.
3. L'appel : la petite lumière qui guide apparaît.
4. La rencontre : le compagnon et son défaut attachant.
5. Premier essai : il échoue, la ritournelle revient.
6. Deuxième essai : il réussit presque, la ritournelle revient.
7. Troisième essai : l'idée vient de l'enfant et utilise son objet.
8. La résolution : ce qui a changé, montré par un geste.
9. Le retour au lit (ou au calme) : la dernière phrase douce, et l'accroche de l'épisode suivant.
Trois champs accompagnent le plan : la ritournelle (une phrase de moins de dix mots, reprise MOT POUR MOT trois fois dans le texte), l'émotion de départ et l'émotion d'arrivée.`;

/** La grille de relecture (donnée à l'IA relectrice). */
export const GRILLE = `LA GRILLE DE RELECTURE
Chaque critère est noté de 1 à 5, avec une justification d'une phrase qui cite le passage concerné.
1. voix_haute — Le texte se lit-il sans buter, avec un rythme régulier ? Échec : phrases de plus de 15 mots (sauf 8-12 ans), incises, répétitions involontaires.
2. ritournelle — Revient-elle trois fois, mot pour mot, facile à retenir ? Échec : absente, ou reformulée à chaque fois.
3. structure — Y a-t-il trois essais, dont un vrai échec ? Échec : le problème se règle au premier essai.
4. enfant_agit — La solution vient-elle de l'enfant ? Échec : un adulte ou la magie résout tout.
5. personnalisation — Le prénom, l'objet et les détails servent-ils l'intrigue ? Échec : ils sont seulement cités, on pourrait les retirer.
6. feerique — La magie est-elle petite, précise, dans le lexique de la bible ? Échec : adjectifs vagues, mots limités répétés.
7. age — Longueur, phrases et vocabulaire respectent-ils la tranche d'âge ? Échec : trop long, mots abstraits, enjeu inadapté.
8. fin — Est-elle douce, sans morale, avec l'accroche pour une série ? Échec : morale écrite, fin brusque, pas de retour au calme.

Motifs éliminatoires (un seul suffit à imposer la réécriture, quelle que soit la note) :
- Une peur non résolue, de la violence ou une moquerie.
- Une erreur sur le prénom, le genre ou l'objet de l'enfant.
- Une contradiction avec un épisode précédent de sa série.
- Un passage repris presque mot pour mot d'un extrait de style fourni à l'autrice.
- Un cliché de la liste interdite de la bible.

Une histoire est ACCEPTÉE à 32 sur 40 ou plus, sans aucun critère sous 3 et sans motif éliminatoire.`;

export const SEUIL_ACCEPTATION = 32;
