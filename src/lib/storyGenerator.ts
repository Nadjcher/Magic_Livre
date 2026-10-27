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
import {
  SYSTEM_PROMPT,
  buildUserMessage,
  ageGuidance,
  type StoryRequest,
} from "./storyPrompt";
import { parseStory, type Story } from "./storySchema";
import { filterStory } from "./contentFilter";
import { findProtectedNames } from "./protectedCharacters";
import { findHeroById } from "./heroes";
import { generateIllustration, illustrationsEnabled } from "./illustration";
import { faceIdentityEnabled, generateCharacterPortrait } from "./faceIdentity";
import { ILLUSTRATION_STYLES } from "./style_config";

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
async function callModel(
  client: OpenAI,
  model: string,
  system: string,
  userMessage: string,
  temperature = 0.9,
): Promise<string> {
  const response = await client.chat.completions.create(
    {
      model,
      max_tokens: 6000,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    },
    { timeout: 90_000 },
  );

  return response.choices[0]?.message?.content?.trim() ?? "";
}

/** Prompt « éditeur » : réécrit une histoire pour la clarifier et l'adapter à l'âge. */
const EDITOR_SYSTEM = `Tu es un éditeur jeunesse exigeant. On te donne une histoire au format JSON. Tu la RÉÉCRIS pour l'améliorer, SANS changer la structure JSON ni le nombre de pages.
Objectifs : clarté absolue (le parent et l'enfant comprennent tout de suite), émotion sincère, fluidité, et surtout un respect PARFAIT de l'âge indiqué (longueur de phrase et vocabulaire).
Garde le même héros, le même fil, les mêmes scènes. Améliore le texte de chaque page et le titre si besoin. Conserve "scene_illustration" en anglais, détaillé, cohérent.
IMPÉRATIF : supprime toute répétition mécanique (par ex. la même phrase recollée à la fin de chaque page) — chaque page doit avoir un texte différent. Corrige toute tournure maladroite ou agrammaticale (ex. « avance avec le sourire » → « avance en souriant »).
Réponds UNIQUEMENT avec le même JSON strict : { "titre": string, "pages": [ { "texte": string, "scene_illustration": string } ] }.`;

/**
 * Passe de révision : demande au modèle de réécrire l'histoire validée pour
 * gagner en clarté et en adéquation à l'âge. Renvoie une histoire valide et
 * filtrée, ou null si la réécriture échoue (on garde alors l'originale).
 */
async function polishStory(
  client: OpenAI,
  model: string,
  story: Story,
  req: StoryRequest,
): Promise<Story | null> {
  const message = [
    `Âge de l'enfant : ${req.childAge} ans.`,
    "Consignes d'âge à respecter STRICTEMENT :",
    ageGuidance(req.childAge),
    "",
    "Histoire à réécrire (améliore le texte, garde la structure) :",
    JSON.stringify({ titre: story.titre, pages: story.pages.map((p) => ({ texte: p.texte, scene_illustration: p.scene_illustration })) }),
  ].join("\n");

  let raw: string;
  try {
    // Température basse à la relecture (fidélité + correction).
    raw = await callModel(client, model, EDITOR_SYSTEM, message, 0.4);
  } catch {
    return null;
  }

  const parsed = parseStory(raw);
  if (!parsed.ok) return null;
  const filtered = filterStory(parsed.story);
  if (!filtered.ok) return null;

  const fullText = [
    parsed.story.titre,
    ...parsed.story.pages.map((p) => `${p.texte} ${p.scene_illustration}`),
  ].join(" ");
  if (findProtectedNames(fullText).length > 0) return null;

  return parsed.story;
}

/**
 * Génère une histoire validée et filtrée. Réessaie une fois en cas de format
 * invalide. Applique le filtre de contenu et le refus des personnages protégés
 * sur la sortie avant de renvoyer le résultat.
 */
export async function generateStory(req: StoryRequest): Promise<GenerateResult> {
  const userMessage = buildUserMessage(req);
  const client = createClient();
  // Édition premium : modèle de texte haut de gamme (configurable).
  const model = req.premium ? env.groqModelPremium() : env.groqModel();

  // Le portrait « vraie ressemblance » (fal) ne dépend que de la photo : on le
  // lance tout de suite, EN PARALLÈLE de l'écriture du texte, pour que ses
  // 20–50 s ne s'ajoutent pas au temps total de génération.
  const style = req.style ?? "feerique";
  const portraitPromise: Promise<{ base64: string; mime: string } | null> =
    illustrationsEnabled() && faceIdentityEnabled() && req.photo
      ? generateCharacterPortrait({
          photo: req.photo,
          stylePrompt: ILLUSTRATION_STYLES[style].prompt,
          appearance: req.appearance,
        })
      : Promise.resolve(null);

  let lastMessage = "La génération de l'histoire a échoué. Veuillez réessayer.";

  // Deux tentatives : la première, puis une seconde en cas de format invalide.
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: string;
    try {
      // Température élevée à l'écriture (créativité).
      raw = await callModel(client, model, SYSTEM_PROMPT, userMessage, 1.0);
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

    // Passe de révision éditoriale (clarté + adéquation à l'âge). En cas
    // d'échec de la réécriture, on conserve l'histoire d'origine.
    const polished = await polishStory(client, model, parsed.story, req);
    const base = polished ?? parsed.story;

    // Texte validé : on ajoute les illustrations si la génération est activée.
    const story = await addIllustrations(base, req, await portraitPromise);
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
async function addIllustrations(
  story: Story,
  req: StoryRequest,
  /** Portrait ressemblant déjà généré (fal), ou null. */
  portrait: { base64: string; mime: string } | null,
): Promise<Story> {
  const style = req.style ?? "feerique";
  if (!illustrationsEnabled()) {
    return { ...story, style };
  }

  const heroName =
    req.mode === "hero" && req.heroId
      ? findHeroById(req.heroId)?.nom
      : req.childFirstName;
  const base = hashSeed(story.titre + req.childFirstName);

  // 0) VRAIE RESSEMBLANCE : le portrait (fal), lancé en parallèle du texte,
  //    sert d'ancre de personnage s'il a pu être généré.

  // 1) COUVERTURE : fixe le design du héros. Ancrée sur le portrait ressemblant
  //    s'il existe (sinon, elle deviendra elle-même l'ancre des pages).
  const cover = await generateIllustration({
    style,
    scene: `couverture de livre : ${story.titre}`,
    heroName,
    appearance: req.appearance,
    referenceImage: req.photo,
    anchorImage: portrait ?? undefined,
    premium: req.premium,
    seed: base,
  });

  // Ancre de personnage pour toutes les pages : le portrait ressemblant en
  // priorité, sinon la couverture → même enfant, même tenue, même style partout.
  const anchor =
    portrait ??
    (cover.base64 !== undefined
      ? { base64: cover.base64, mime: cover.mime ?? "image/png" }
      : undefined);

  // 2) Toutes les pages, ancrées sur la couverture (cohérence) + photo (ressemblance).
  const pages = await Promise.all(
    story.pages.map(async (p, i) => {
      const { imageUrl } = await generateIllustration({
        style,
        scene: p.scene_illustration,
        heroName,
        appearance: req.appearance,
        // Si on a un portrait ressemblant, il suffit comme référence (charge
        // allégée) ; sinon on garde la photo comme référence.
        referenceImage: portrait ? undefined : req.photo,
        anchorImage: anchor,
        premium: req.premium,
        seed: base + i + 1,
      });
      return { ...p, imageUrl };
    }),
  );

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
