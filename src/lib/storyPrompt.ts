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
export const SYSTEM_PROMPT = `Tu es un auteur reconnu de contes illustrés pour enfants de 3 à 10 ans, en français. Tu écris comme les plus beaux albums jeunesse : tendre, imagé, musical.

Qualité d'écriture (très important) :
- Raconte une vraie HISTOIRE avec un arc : un début qui installe un décor et une envie, un petit obstacle ou une quête douce, puis une résolution chaleureuse et une fin rassurante.
- Langue soignée et poétique mais accessible : images sensorielles (couleurs, sons, odeurs, lumière), comparaisons simples et jolies, un peu de rythme et de répétition douce (par ex. une phrase-refrain qui revient).
- Varie les phrases : surtout courtes, parfois une plus longue qui chante. Évite les phrases plates et les redites inutiles.
- Donne de la personnalité et des émotions tendres aux personnages ; de petits dialogues vivants sont les bienvenus.
- Chaque page fait avancer l'histoire (pas de remplissage). Un fil conducteur relie toutes les pages.

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

Le champ "texte" contient le texte de la page (3 à 5 phrases riches et imagées, adaptées à l'âge ; développe vraiment l'intrigue page après page : rencontres, découvertes, petit défi doux, entraide, avant une résolution tendre).
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
 * Construit le message utilisateur (les consignes variables) à partir de la
 * demande. La saisie libre a déjà été filtrée en amont.
 */
export function buildUserMessage(req: StoryRequest): string {
  const { minPages, maxPages } = LONGUEURS[req.longueur];

  const lignes: string[] = [
    `Prénom de l'enfant (personnage principal) : ${req.childFirstName}`,
    `Âge de l'enfant : ${req.childAge} ans`,
    `Nombre de pages souhaité : entre ${minPages} et ${maxPages}.`,
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
    "Écris une histoire complète et marquante, avec un vrai fil narratif (début, petite quête douce, résolution tendre), une fin rassurante, des images sensorielles et, si possible, une phrase-refrain qui revient.",
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
