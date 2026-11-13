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
    .min(4, "L'histoire doit contenir au moins 4 pages.")
    .max(12, "L'histoire ne doit pas dépasser 12 pages."),
  // Fiche visuelle (en anglais) des personnages secondaires récurrents, reprise
  // à l'identique dans chaque illustration pour qu'ils ne changent pas.
  personnages: z
    .preprocess(
      (v) => (v == null ? undefined : typeof v === "string" ? v : JSON.stringify(v)),
      z.string().optional(),
    )
    .transform((v) => v?.slice(0, 1500))
    .optional(),
  // Distribution : personnages secondaires récurrents (fiches dessinées).
  cast: z
    .preprocess((v) => (Array.isArray(v) ? v.slice(0, 5) : undefined), z.array(castSchema).optional())
    .catch(undefined),
  // Illustration de couverture (optionnelle).
  couvertureUrl: z.string().url().nullable().optional(),
  /** Scène de couverture imposée (histoires maîtresses) ; sinon tirée de la page centrale. */
  couvertureScene: z.string().max(800).optional().catch(undefined),
  // Style d'illustration retenu (mémoire, utile pour un « tome » suivant).
  style: z.enum(ILLUSTRATION_STYLE_KEYS).optional(),
  // Fiches de référence dessinées (héros + personnages secondaires), gardées pour
  // pouvoir redessiner une page avec exactement les mêmes personnages.
  fiches: z
    .object({ heros: z.string().url().nullable().optional(), cast: z.record(z.string(), z.string().url()).optional() })
    .optional()
    .catch(undefined),
  // Commandes de livre imprimé (imprimeur Gelato).
  impressions: z
    .array(z.object({ orderId: z.string(), gelatoId: z.string(), creeLe: z.number() }))
    .optional()
    .catch(undefined),
  // Livres imprimés payés, en attente de la validation du parent (rien n'est envoyé à l'imprimeur avant).
  impressionsAValider: z
    .array(z.object({ orderId: z.string(), depuis: z.number(), retouchesAuDebut: z.number(), relances: z.number().optional() }))
    .optional()
    .catch(undefined),
  // Plan en neuf cases (bible), écrit par l'autrice avant les pages.
  plan: z
    .object({
      objet_cle: z.string().optional(),
      compagnon: z.string().optional(),
      ritournelle: z.string().optional(),
      emotion_depart: z.string().optional(),
      emotion_arrivee: z.string().optional(),
      cases: z.array(z.object({ n: z.number(), page: z.number().optional(), resume: z.string() })).optional(),
      accroche_suite: z.string().optional(),
    })
    .optional()
    .catch(undefined),
  // Faits établis par l'histoire (règles du monde) : à ne jamais contredire dans la série.
  faits: z.preprocess((v) => (typeof v === "string" ? v.slice(0, 500) : undefined), z.string().optional()),
  // Mémoire pour la série : résumé de l'épisode, fils laissés ouverts, et
  // 3 suites possibles proposées à l'enfant (« Et demain ? »).
  resume: z.preprocess((v) => (typeof v === "string" ? v.slice(0, 600) : undefined), z.string().optional()),
  fils: z.preprocess((v) => (typeof v === "string" ? v.slice(0, 400) : undefined), z.string().optional()),
  suites: z
    .preprocess((v) => (Array.isArray(v) ? v.map(String).map((x) => x.slice(0, 140)).slice(0, 3) : undefined), z.array(z.string()).optional())
    .catch(undefined),
  // Épisode d'une série : identifiant de la série (= id du premier livre) et numéro.
  serie: z.object({ id: z.string(), numero: z.number().int().min(1) }).optional().catch(undefined),
  // Fiche de la demande (pour la bibliothèque d'exemples et les séries).
  meta: z
    .object({
      age: z.number(),
      format: z.string().optional(),
      themeId: z.string().optional(),
      mode: z.string().optional(),
      trame: z.string().optional(),
      modeles: z.array(z.string()).optional(),
      // Idée du parent ou suite choisie par l'enfant (pour relancer l'écriture).
      prompt: z.string().max(400).optional(),
    })
    .optional()
    .catch(undefined),
  // Relecture notée par la directrice littéraire (IA).
  qualite: z
    .object({
      note: z.number(),
      notes: z.record(z.string(), z.number()).optional(),
      problemes: z.array(z.string()),
      reecrit: z.boolean(),
      total: z.number().optional(),
      max: z.number().optional(),
      justifications: z.record(z.string(), z.string()).optional().catch(undefined),
      accepte: z.boolean().optional(),
      eliminatoire: z.string().nullable().optional(),
      essais: z.number().optional(),
      aRevoir: z.boolean().optional(),
    })
    .optional()
    .catch(undefined),
  // Contrôle des illustrations : images vérifiées et refaites (suivi du coût par livre).
  controleImages: z.object({ verifiees: z.number(), refaites: z.number(), nonVerifiees: z.number().optional() }).optional().catch(undefined),
  // Illustrations restées fautives après une nouvelle tentative (-1 = couverture) : relecture humaine.
  imagesARevoir: z.array(z.number().int()).optional().catch(undefined),
  // Aperçu gratuit : seules la couverture et les premières pages sont illustrées ;
  // le reste est dessiné à l'achat ou pour les membres du Club.
  apercu: z.boolean().optional(),
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
