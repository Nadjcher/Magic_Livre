/**
 * Génération de l'histoire via l'API Anthropic (Claude).
 *
 * Appelée UNIQUEMENT côté serveur. La clé API et le prompt système ne sont
 * jamais renvoyés au client. En cas d'échec de format, on réessaie une fois,
 * puis on renvoie une erreur claire en français.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";
import { SYSTEM_PROMPT, buildUserMessage, type StoryRequest } from "./storyPrompt";
import { parseStory, type Story } from "./storySchema";
import { filterStory } from "./contentFilter";
import { findProtectedNames } from "./protectedCharacters";

export type GenerateResult =
  | { ok: true; story: Story }
  | { ok: false; message: string };

/**
 * Client Anthropic créé paresseusement pour ne lire la clé qu'au moment de
 * l'appel (et pas au chargement du module).
 */
function createClient(): Anthropic {
  return new Anthropic({ apiKey: env.anthropicApiKey() });
}

/**
 * Appelle le modèle une fois et renvoie le texte brut de la réponse.
 */
async function callModel(client: Anthropic, userMessage: string): Promise<string> {
  const response = await client.messages.create({
    model: env.anthropicModel(),
    max_tokens: 4096,
    temperature: 0.8,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  // Concatène les blocs de texte de la réponse.
  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}

/**
 * Génère une histoire validée et filtrée. Réessaie une fois en cas de format
 * invalide. Applique le filtre de contenu et le refus des personnages protégés
 * sur la sortie avant de renvoyer le résultat.
 */
export async function generateStory(req: StoryRequest): Promise<GenerateResult> {
  const userMessage = buildUserMessage(req);
  const client = createClient();

  let lastMessage = "La génération de l'histoire a échoué. Veuillez réessayer.";

  // Deux tentatives : la première, puis une seconde en cas de format invalide.
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: string;
    try {
      raw = await callModel(client, userMessage);
    } catch {
      lastMessage =
        "Le service de génération est momentanément indisponible. Réessayez dans quelques instants.";
      // Erreur réseau/API : inutile de réessayer immédiatement.
      break;
    }

    const parsed = parseStory(raw);
    if (!parsed.ok) {
      lastMessage =
        "L'histoire générée n'était pas au bon format. Veuillez réessayer.";
      continue; // réessaie une fois
    }

    // Filtre de contenu sur la sortie.
    const filtered = filterStory(parsed.story);
    if (!filtered.ok) {
      lastMessage =
        "L'histoire générée contenait un passage inadapté. Veuillez réessayer avec une autre idée.";
      continue;
    }

    // Vérification des personnages protégés sur l'ensemble du texte.
    const fullText = [
      parsed.story.titre,
      ...parsed.story.pages.map((p) => `${p.texte} ${p.scene_illustration}`),
    ].join(" ");
    if (findProtectedNames(fullText).length > 0) {
      lastMessage =
        "L'histoire générée mentionnait un personnage protégé. Veuillez réessayer.";
      continue;
    }

    return { ok: true, story: parsed.story };
  }

  return { ok: false, message: lastMessage };
}
