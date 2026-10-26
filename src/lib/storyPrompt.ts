/**
 * Prompt système fixe de génération d'histoire.
 *
 * Ce prompt n'est JAMAIS renvoyé au client. Il impose le ton, la sécurité,
 * la structure et le format JSON strict de sortie.
 */

import type { LongueurKey } from "./validation";
import { LONGUEURS } from "./validation";
import { findHeroById } from "./heroes";
import type { IllustrationStyle } from "./style_config";

/** Prompt système fixe (indépendant de la saisie). */
export const SYSTEM_PROMPT = `Tu es un auteur reconnu de contes illustrés pour enfants, en français. Tu écris comme les plus beaux albums jeunesse : tendre, imagé, musical.

RÈGLE N°1 — ADAPTER À L'ÂGE (la plus importante) :
Tu reçois l'âge exact de l'enfant. Tu DOIS adapter rigoureusement le vocabulaire, la longueur des phrases, la structure et les thèmes à cet âge. Une histoire pour un enfant de 2 ans n'a RIEN à voir avec une histoire pour 8 ans. Respecte à la lettre les consignes d'âge données dans la demande (longueur des phrases, mots simples, répétitions…). Un texte trop compliqué ou trop long pour l'âge est un échec.

Qualité d'écriture :
- Raconte une vraie HISTOIRE claire et facile à suivre : un début qui pose le décor, une petite quête ou un petit souci, puis une résolution chaleureuse et une fin rassurante. L'enfant (et le parent qui lit) doit comprendre immédiatement ce qui se passe.
- Langue accessible et jolie : images sensorielles simples (couleurs, sons, lumière), rythme, et une phrase-refrain douce qui revient (surtout pour les petits).
- Donne des émotions tendres aux personnages ; de petits dialogues vivants quand l'âge s'y prête.
- Chaque page fait avancer l'histoire (pas de remplissage). Un fil conducteur clair relie toutes les pages.
- INTERDIT : recoller la même phrase à la fin de chaque page. Chaque page a un texte DIFFÉRENT. Une phrase-refrain éventuelle revient 2–3 fois maximum, jamais partout, et est bien écrite (grammaire soignée).

Originalité (très important) :
- INTERDIT : la trame plate « le héros fait une activité banale (jouer, marcher, chercher) et tout le monde est content à la fin ». Ce genre d'histoire est un ÉCHEC.
- Chaque histoire a un ÉLÉMENT IMAGINAIRE FORT et unique : un objet qui prend vie ou parle, un petit pouvoir inattendu, un monde aux règles amusantes, un problème cocasse à résoudre avec malice, une créature originale (inventée, jamais sous droits).
- Un vrai TWIST ou une surprise qui rend cette histoire mémorable et différente de toutes les autres. Un brin d'humour ou d'émerveillement.
- Donne au héros un désir clair, un obstacle amusant, et une résolution MALINE (pas juste « il est gentil »). Reste 100% adapté à l'âge et rassurant.

Règles impératives :
- Ton doux, bienveillant, jamais effrayant ni triste durablement. Fin heureuse et rassurante.
- AUCUNE violence, AUCUNE peur extrême, AUCUN contenu inadapté.
- Le prénom fourni est le héros ; il apparaît dans chaque page et agit.
- N'utilise JAMAIS de personnage ou marque sous droits (Disney, Pixar, Marvel, DC, Nintendo, Pokémon, films, séries...). Invente des personnages originaux.
- Titre évocateur et poétique (pas générique).

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un objet JSON strict, sans texte avant ni après, sans balises de code. Structure exacte :
{
  "titre": "string",
  "pages": [
    { "texte": "string", "scene_illustration": "string" }
  ]
}

Le champ "texte" contient le texte de la page, dont la longueur et la complexité suivent STRICTEMENT les consignes d'âge de la demande (d'une seule phrase très courte pour un tout-petit, jusqu'à plusieurs phrases riches pour un grand).
Le champ "scene_illustration" décrit précisément la scène à dessiner EN ANGLAIS (décor, personnages, action, émotion, lumière), en une phrase détaillée, sans aucun texte écrit ni personnage protégé.`;

export interface StoryRequest {
  childFirstName: string;
  childAge: number;
  mode: "hero" | "libre";
  heroId?: string;
  prompt?: string;
  longueur: LongueurKey;
  /** Style d'illustration choisi (sert aussi à teinter le ton du texte). */
  style?: IllustrationStyle;
  /** Description d'apparence de l'enfant (facultative). */
  appearance?: string;
  /**
   * Photo de référence (base64) pour dessiner un héros ressemblant à l'enfant.
   * Utilisée seulement pendant la génération des images ; jamais stockée.
   */
  photo?: { base64: string; mime: string };
  /** Édition premium : illustrations générées avec le modèle haut de gamme. */
  premium?: boolean;
}

/**
 * Consignes d'écriture précises selon l'âge de l'enfant. C'est le levier
 * principal de qualité : chaque tranche d'âge a ses règles (longueur des
 * phrases, vocabulaire, structure, thèmes).
 */
export function ageGuidance(age: number): string {
  if (age <= 2) {
    return [
      "ÂGE 0–2 ANS (tout-petit) :",
      "- UNE seule phrase TRÈS courte par page (3 à 7 mots maximum).",
      "- Mots du quotidien, ultra-simples et concrets (doudou, câlin, dodo, maman, papa, animaux, couleurs).",
      "- Une TRÈS courte phrase-refrain douce peut revenir 2 à 3 fois dans tout le livre (comme une comptine), JAMAIS la même phrase recollée à la fin de chaque page.",
      "- Des sons rigolos (« Plouf ! », « Coucou ! », « Hop ! »).",
      "- Pas d'intrigue compliquée : juste de petits moments tendres et rassurants, qui finissent par un câlin ou un dodo.",
    ].join("\n");
  }
  if (age <= 4) {
    return [
      "ÂGE 3–4 ANS :",
      "- 1 à 2 phrases courtes et simples par page.",
      "- Vocabulaire courant, concret ; une petite quête douce et facile à suivre.",
      "- Éventuellement une courte phrase-refrain qui revient 2–3 fois (pas à chaque page), intégrée naturellement.",
      "- Thèmes proches de l'enfant : amitié, partage, peur du noir apprivoisée, découverte.",
    ].join("\n");
  }
  if (age <= 6) {
    return [
      "ÂGE 5–6 ANS :",
      "- 2 à 3 phrases par page, claires et imagées.",
      "- Une vraie petite intrigue avec un défi doux et une résolution ; un soupçon d'humour.",
      "- Émotions nommées simplement (fier, timide, courageux).",
    ].join("\n");
  }
  if (age <= 8) {
    return [
      "ÂGE 7–8 ANS :",
      "- 3 à 4 phrases par page, vocabulaire plus riche.",
      "- Une aventure construite avec un petit rebondissement et une morale douce.",
      "- Dialogues vivants, personnages avec du caractère.",
    ].join("\n");
  }
  return [
    "ÂGE 9–10 ANS :",
    "- 4 à 5 phrases par page, langue soignée et nuancée.",
    "- Intrigue développée (début, péripéties, résolution), émotions plus fines.",
    "- Descriptions évocatrices, un brin d'humour ou de mystère doux.",
  ].join("\n");
}

/**
 * « Étincelles » d'originalité : un ingrédient imaginaire tiré au hasard et
 * glissé dans la demande, pour que deux histoires ne se ressemblent jamais.
 */
const SPARKS = [
  "un objet du quotidien qui prend vie et devient un compagnon malicieux",
  "un tout petit pouvoir magique inattendu que le héros découvre",
  "un monde où une règle amusante est inversée (la pluie monte, les ombres parlent…)",
  "une créature originale et rigolote, entièrement inventée",
  "une couleur, un son ou une odeur qui a mystérieusement disparu et qu'il faut retrouver",
  "une porte / un passage secret vers un lieu merveilleux",
  "un objet magique qui ne fonctionne que d'une façon drôle et inattendue",
  "un petit quiproquo cocasse qui lance l'aventure",
  "une carte au trésor qui mène à quelque chose de surprenant (pas un trésor classique)",
  "un ami imaginaire qui a un problème étonnant à résoudre",
  "des jouets / des nuages / des étoiles qui s'organisent en secret la nuit",
  "une collection d'objets magiques minuscules à assembler",
];

function pickSpark(): string {
  return SPARKS[Math.floor(Math.random() * SPARKS.length)] as string;
}

/**
 * Construit le message utilisateur (les consignes variables) à partir de la
 * demande. La saisie libre a déjà été filtrée en amont.
 */
export function buildUserMessage(req: StoryRequest): string {
  const { minPages, maxPages } = LONGUEURS[req.longueur];

  const lignes: string[] = [
    `Prénom de l'enfant (personnage principal) : ${req.childFirstName}`,
    `Âge de l'enfant : ${req.childAge} ans`,
    "",
    "Consignes d'âge À RESPECTER STRICTEMENT :",
    ageGuidance(req.childAge),
    "",
    `Nombre de pages souhaité : entre ${minPages} et ${maxPages} (garde chaque page à la longueur imposée par l'âge ci-dessus, même s'il y a beaucoup de pages).`,
  ];

  if (req.mode === "hero") {
    const hero = req.heroId ? findHeroById(req.heroId) : undefined;
    if (hero) {
      lignes.push(
        `Héros secondaire original à inclure : ${hero.nom}. ${hero.description}`,
      );
      lignes.push(
        `${req.childFirstName} vit une aventure avec ${hero.nom}.`,
      );
    }
  } else if (req.mode === "libre" && req.prompt) {
    lignes.push(`Idée d'aventure proposée par le parent : « ${req.prompt} »`);
  }

  if (req.appearance && req.appearance.trim().length > 0) {
    lignes.push(
      `Apparence de l'enfant (à refléter avec délicatesse) : ${req.appearance.trim()}.`,
    );
  }

  lignes.push(
    `Étincelle d'originalité à intégrer avec finesse (adapte-la à l'âge, garde une histoire cohérente et rassurante) : ${pickSpark()}.`,
  );
  lignes.push(
    "Écris une histoire claire et facile à comprendre, avec un fil narratif simple (début, petite quête douce, résolution tendre) et une fin rassurante — SANS JAMAIS dépasser la longueur de phrase et le vocabulaire imposés par l'âge ci-dessus. Surtout : surprends, sois original, évite toute trame plate.",
  );
  lignes.push(
    `Garde ${req.childFirstName} au cœur de chaque page, avec des émotions tendres et un décor vivant.`,
  );
  lignes.push(
    "Pour chaque page, scene_illustration est une phrase DÉTAILLÉE EN ANGLAIS décrivant la scène (décor, personnages, action, émotion, lumière), cohérente d'une page à l'autre, sans texte écrit.",
  );
  lignes.push("Réponds UNIQUEMENT avec le JSON strict demandé.");

  return lignes.join("\n");
}
