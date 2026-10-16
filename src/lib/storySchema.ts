/**
 * Schéma Zod de la réponse attendue du modèle de langage.
 *
 * Le modèle doit répondre UNIQUEMENT en JSON strict :
 *   { "titre": string, "pages": [{ "texte": string, "scene_illustration": string }] }
 *
 * On impose 8 à 12 pages.
 */

import { z } from "zod";

export const storyPageSchema = z.object({
  texte: z.string().min(1, "Le texte de la page est vide."),
  scene_illustration: z
    .string()
    .min(1, "La description de l'illustration est vide."),
});

export const storySchema = z.object({
  titre: z.string().min(1, "Le titre est vide."),
  pages: z
    .array(storyPageSchema)
    .min(8, "L'histoire doit contenir au moins 8 pages.")
    .max(12, "L'histoire ne doit pas dépasser 12 pages."),
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
