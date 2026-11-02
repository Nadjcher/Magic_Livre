/**
 * Schéma Zod de la réponse attendue du modèle de langage.
 *
 * Le modèle doit répondre UNIQUEMENT en JSON strict :
 *   { "titre": string, "pages": [{ "texte": string, "scene_illustration": string }] }
 *
 * On impose 8 à 12 pages.
 */

import { z } from "zod";
import { ILLUSTRATION_STYLE_KEYS } from "./style_config";

export const storyPageSchema = z.object({
  texte: z.string().min(1, "Le texte de la page est vide."),
  scene_illustration: z
    .string()
    .min(1, "La description de l'illustration est vide."),
  // URL de l'illustration générée (ajoutée après la génération du texte).
  imageUrl: z.string().url().nullable().optional(),
  // Personnages secondaires visibles sur l'illustration (noms de la distribution).
  presents: z
    .preprocess((v) => (Array.isArray(v) ? v.map(String).slice(0, 6) : undefined), z.array(z.string()).optional()),
});

/** Personnage secondaire récurrent : nom + description visuelle (anglais). */
export const castSchema = z.object({
  nom: z.string().min(1).max(40),
  visuel: z.string().min(1).max(400),
});

/** Une scène de la bande-annonce : clip animé (IA vidéo) + phrase lue. */
export const trailerSceneSchema = z.object({
  source: z.union([z.literal("cover"), z.number().int().min(0).max(20)]),
  phrase: z.string().max(300),
  statusUrl: z.string().url().nullable().optional(),
  responseUrl: z.string().url().nullable().optional(),
  clipUrl: z.string().url().nullable().optional(),
  audioUrl: z.string().url().nullable().optional(),
  // Durées (secondes) : voix off et clip animé (5 ou 10 s).
  audioSec: z.number().nullable().optional(),
  clipSec: z.number().nullable().optional(),
  erreur: z.string().max(300).nullable().optional(),
});

export const trailerSchema = z.object({
  creeLe: z.number(),
  essais: z.number().int().min(0).default(1),
  scenes: z.array(trailerSceneSchema).max(16),
  // Montage final (fait par fal) : file d'attente puis vidéo MP4.
  finalStatusUrl: z.string().url().nullable().optional(),
  finalResponseUrl: z.string().url().nullable().optional(),
  finalUrl: z.string().url().nullable().optional(),
  finalErreur: z.string().max(300).nullable().optional(),
});
export type Trailer = z.infer<typeof trailerSchema>;

export const storySchema = z.object({
  titre: z.string().min(1, "Le titre est vide."),
  pages: z
    .array(storyPageSchema)
    .min(8, "L'histoire doit contenir au moins 8 pages.")
    .max(12, "L'histoire ne doit pas dépasser 12 pages."),
  // Fiche visuelle (en anglais) des personnages secondaires récurrents, reprise
  // à l'identique dans chaque illustration pour qu'ils ne changent pas.
  personnages: z
    .preprocess(
      (v) => (v == null ? undefined : typeof v === "string" ? v : JSON.stringify(v)),
      z.string().optional(),
    )
    .transform((v) => v?.slice(0, 1500)),
  // Distribution : personnages secondaires récurrents (fiches dessinées).
  cast: z
    .preprocess((v) => (Array.isArray(v) ? v.slice(0, 5) : undefined), z.array(castSchema).optional())
    .catch(undefined),
  // Illustration de couverture (optionnelle).
  couvertureUrl: z.string().url().nullable().optional(),
  // Style d'illustration retenu (mémoire, utile pour un « tome » suivant).
  style: z.enum(ILLUSTRATION_STYLE_KEYS).optional(),
  // Fiches de référence dessinées (héros + personnages secondaires), gardées pour
  // pouvoir redessiner une page avec exactement les mêmes personnages.
  fiches: z
    .object({ heros: z.string().url().nullable().optional(), cast: z.record(z.string().url()).optional() })
    .optional()
    .catch(undefined),
  // Commandes de livre imprimé (imprimeur Gelato).
  impressions: z
    .array(z.object({ orderId: z.string(), gelatoId: z.string(), creeLe: z.number() }))
    .optional()
    .catch(undefined),
  // Nombre de pages redessinées à la demande (plafonné).
  retouches: z.number().int().min(0).optional(),
  // Bande-annonce vidéo (produit payant) : scènes animées + voix off.
  video: trailerSchema.optional(),
});

export type Story = z.infer<typeof storySchema>;
export type StoryPage = z.infer<typeof storyPageSchema>;

/**
 * Tente d'extraire et de valider un objet Story à partir du texte brut renvoyé
 * par le modèle. Gère le cas où le modèle entoure le JSON de texte ou de
 * balises de code (```json ... ```).
 *
 * Renvoie soit l'histoire validée, soit une erreur avec un message en français.
 */
export function parseStory(
  raw: string,
): { ok: true; story: Story } | { ok: false; message: string } {
  const jsonText = extractJson(raw);
  if (jsonText === null) {
    return {
      ok: false,
      message: "La réponse du générateur n'était pas au format attendu.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      message: "La réponse du générateur n'était pas un JSON valide.",
    };
  }

  const result = storySchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      message:
        "La structure de l'histoire générée est incorrecte : " +
        result.error.issues.map((i) => i.message).join(" "),
    };
  }

  return { ok: true, story: result.data };
}

/**
 * Extrait la portion JSON d'un texte : retire d'éventuelles balises de code
 * et isole le premier objet `{ ... }` équilibré.
 */
function extractJson(raw: string): string | null {
  const withoutFences = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = withoutFences.indexOf("{");
  if (start === -1) return null;

  // Recherche de l'accolade fermante correspondante (en comptant les niveaux),
  // en ignorant les accolades à l'intérieur des chaînes de caractères.
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < withoutFences.length; i++) {
    const ch = withoutFences[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return withoutFences.slice(start, i + 1);
      }
    }
  }

  return null;
}
