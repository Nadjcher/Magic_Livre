/**
 * Génération de l'histoire via l'API Anthropic (Claude).
 *
 * Appelée UNIQUEMENT côté serveur. La clé API et le prompt système ne sont
 * jamais renvoyés au client. En cas d'échec de format, on réessaie une fois,
 * puis on renvoie une erreur claire en français.
 */

import "server-only";
import OpenAI from "openai";
import { env } from "./env";
import { SYSTEM_PROMPT, buildUserMessage, type StoryRequest } from "./storyPrompt";
import { parseStory, type Story } from "./storySchema";
import { filterStory } from "./contentFilter";
import { findProtectedNames } from "./protectedCharacters";
import { findHeroById } from "./heroes";
import { generateIllustration, illustrationsEnabled } from "./illustration";

export type GenerateResult =
  | { ok: true; story: Story }
  | { ok: false; message: string };

/**
 * Client Groq (API compatible OpenAI) créé paresseusement pour ne lire la clé
 * qu'au moment de l'appel.
 */
function createClient(): OpenAI {
  return new OpenAI({
    apiKey: env.groqApiKey(),
    baseURL: "https://api.groq.com/openai/v1",
  });
}

/**
 * Appelle le modèle une fois et renvoie le texte brut de la réponse (JSON).
 */
async function callModel(client: OpenAI, userMessage: string): Promise<string> {
  const response = await client.chat.completions.create(
    {
      model: env.groqModel(),
      max_tokens: 6000,
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    },
    { timeout: 90_000 },
  );

  return response.choices[0]?.message?.content?.trim() ?? "";
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

    // Texte validé : on ajoute les illustrations si la génération est activée.
    const story = await addIllustrations(parsed.story, req);
    return { ok: true, story };
  }

  return { ok: false, message: lastMessage };
}

/** Petit hachage stable pour dériver une graine d'image reproductible. */
function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 1_000_000;
}

/**
 * Ajoute une illustration à chaque page (et une couverture) si la génération
 * d'images est activée. En cas d'échec, l'URL reste nulle : le livre reste lisible.
 */
async function addIllustrations(story: Story, req: StoryRequest): Promise<Story> {
  const style = req.style ?? "feerique";
  if (!illustrationsEnabled()) {
    return { ...story, style };
  }

  const heroName =
    req.mode === "hero" && req.heroId
      ? findHeroById(req.heroId)?.nom
      : req.childFirstName;
  const base = hashSeed(story.titre + req.childFirstName);

  const pages = await Promise.all(
    story.pages.map(async (p, i) => {
      const { imageUrl } = await generateIllustration({
        style,
        scene: p.scene_illustration,
        heroName,
        appearance: req.appearance,
        referenceImage: req.photo,
        seed: base + i + 1,
      });
      return { ...p, imageUrl };
    }),
  );

  const cover = await generateIllustration({
    style,
    scene: `couverture de livre : ${story.titre}`,
    heroName,
    appearance: req.appearance,
    referenceImage: req.photo,
    seed: base,
  });

  return { ...story, pages, couvertureUrl: cover.imageUrl, style };
}

/**
 * Décrit en quelques mots l'apparence physique d'un enfant à partir d'une photo,
 * via Claude (multimodal). La photo n'est NI stockée NI renvoyée : seule une
 * courte description textuelle est produite, puis réutilisée pour dessiner un
 * personnage inspiré (jamais la vraie photo dans le livre).
 *
 * Renvoie "" en cas d'absence de photo valide ou d'échec.
 */
export async function describeAppearanceFromPhoto(
  dataUrl: string,
): Promise<string> {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) return "";
  const mediaType = (match[1] === "image/jpg" ? "image/jpeg" : match[1]) as
    | "image/png"
    | "image/jpeg"
    | "image/webp";
  const data = match[2] ?? "";
  // Garde-fou de taille, aligné sur la limite de corps des Server Actions (4 Mo) :
  // au-delà, la requête n'aurait de toute façon pas pu arriver jusqu'ici.
  if (data.length === 0 || data.length > 4_000_000) return "";

  try {
    const client = createClient();
    const response = await client.chat.completions.create(
      {
        model: env.groqVisionModel(),
        max_tokens: 120,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${data}` } },
              {
                type: "text",
                text:
                  "Décris en 10 mots maximum, en français, l'apparence physique générale " +
                  "de l'enfant sur cette photo (couleur de cheveux, coupe, couleur des yeux, " +
                  "lunettes éventuelles, teint). N'identifie jamais la personne, ne donne pas " +
                  "de nom, reste factuel et neutre. Réponds uniquement par la description.",
              },
            ],
          },
        ],
      },
      { timeout: 25_000 },
    );
    const texte = (response.choices[0]?.message?.content ?? "").trim();
    return texte.slice(0, 160);
  } catch {
    return "";
  }
}
