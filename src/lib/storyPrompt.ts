/**
 * Prompt système fixe de génération d'histoire.
 *
 * Ce prompt n'est JAMAIS renvoyé au client. Il impose le ton, la sécurité,
 * la structure et le format JSON strict de sortie.
 */

import type { LongueurKey } from "./validation";
import { LONGUEURS } from "./validation";
import { findHeroById } from "./heroes";

/** Prompt système fixe (indépendant de la saisie). */
export const SYSTEM_PROMPT = `Tu es un auteur de contes pour enfants de 3 à 10 ans, en français.

Règles impératives :
- Ton doux, bienveillant et rassurant, adapté aux jeunes enfants.
- Phrases courtes et simples, vocabulaire accessible.
- AUCUNE violence, AUCUNE peur extrême, AUCUN contenu triste durable, AUCUN contenu inadapté.
- Toujours une fin rassurante et positive.
- Le prénom fourni est le personnage principal et doit être utilisé dans chaque page.
- N'utilise JAMAIS de personnage ou de marque protégés par des droits (Disney, Pixar, Marvel, DC, Nintendo, Pokémon, films, séries, etc.). Invente des personnages originaux.
- L'histoire doit comporter entre 8 et 12 pages.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un objet JSON strict, sans texte avant ni après, sans balises de code. Structure exacte :
{
  "titre": "string",
  "pages": [
    { "texte": "string", "scene_illustration": "string" }
  ]
}

Le champ "texte" contient le texte de la page (2 à 5 phrases courtes).
Le champ "scene_illustration" décrit la scène à illustrer, en une phrase, sans aucun texte ni personnage protégé.`;

export interface StoryRequest {
  childFirstName: string;
  childAge: number;
  mode: "hero" | "libre";
  heroId?: string;
  prompt?: string;
  longueur: LongueurKey;
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

  lignes.push(
    "Écris une histoire complète, douce et joyeuse, avec une fin rassurante.",
  );
  lignes.push("Réponds UNIQUEMENT avec le JSON strict demandé.");

  return lignes.join("\n");
}
