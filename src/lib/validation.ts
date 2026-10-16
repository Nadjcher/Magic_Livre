/**
 * Schémas de validation des entrées utilisateur (Zod) et fonctions utilitaires
 * de vérification. Toutes les entrées passant par le serveur sont validées ici.
 */

import { z } from "zod";
import { findProtectedNames } from "./protectedCharacters";
import { filterContent } from "./contentFilter";

/** Longueurs d'histoire proposées, avec le nombre de pages cible. */
export const LONGUEURS = {
  courte: { label: "Courte", minPages: 8, maxPages: 9 },
  moyenne: { label: "Moyenne", minPages: 10, maxPages: 11 },
  longue: { label: "Longue", minPages: 11, maxPages: 12 },
} as const;

export type LongueurKey = keyof typeof LONGUEURS;

/** Schéma d'un enfant. */
export const childSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Le prénom est obligatoire.")
    .max(40, "Le prénom est trop long.")
    // Autorise lettres (accentuées), espaces, tirets et apostrophes.
    .regex(
      /^[\p{L}][\p{L} '-]*$/u,
      "Le prénom contient des caractères non autorisés.",
    ),
  age: z
    .number({ invalid_type_error: "L'âge doit être un nombre." })
    .int("L'âge doit être un nombre entier.")
    .min(1, "L'âge doit être d'au moins 1 an.")
    .max(12, "Cette application est conçue pour les enfants jusqu'à 10-12 ans."),
});

export type ChildInput = z.infer<typeof childSchema>;

/** Schéma de création d'un livre. */
export const createBookSchema = z
  .object({
    childId: z.string().min(1, "Veuillez choisir un enfant."),
    mode: z.enum(["hero", "libre"]),
    // Identifiant du héros original (si mode = hero).
    heroId: z.string().optional(),
    // Texte d'aventure libre (si mode = libre), limité à 300 caractères.
    prompt: z
      .string()
      .trim()
      .max(300, "La description de l'aventure est limitée à 300 caractères.")
      .optional(),
    longueur: z.enum(["courte", "moyenne", "longue"]),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "hero" && !data.heroId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["heroId"],
        message: "Veuillez choisir un héros.",
      });
    }
    if (data.mode === "libre") {
      if (!data.prompt || data.prompt.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prompt"],
          message: "Veuillez décrire l'aventure.",
        });
      }
    }
  });

export type CreateBookInput = z.infer<typeof createBookSchema>;

/** Schéma du consentement parental. */
export const consentSchema = z.object({
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez confirmer être le parent ou le représentant légal.",
    }),
  }),
});

/**
 * Résultat combiné de la vérification d'une saisie d'aventure libre :
 * vérifie à la fois les personnages protégés et le filtre de contenu.
 */
export interface TextCheckResult {
  ok: boolean;
  /** Message d'erreur en français (vide si ok). */
  message: string;
  /** Noms protégés détectés, le cas échéant. */
  protectedNames: string[];
}

/**
 * Vérifie un texte saisi par l'utilisateur (prénom, aventure libre) :
 * refuse les personnages protégés, puis applique le filtre de contenu.
 */
export function checkUserText(input: string): TextCheckResult {
  const protectedNames = findProtectedNames(input);
  if (protectedNames.length > 0) {
    return {
      ok: false,
      protectedNames,
      message:
        "Votre texte mentionne un personnage protégé par des droits " +
        "(par exemple : " +
        protectedNames.slice(0, 3).join(", ") +
        "). Nous ne pouvons pas l'utiliser. Choisissez plutôt l'un de nos " +
        "héros originaux ou inventez votre propre personnage.",
    };
  }

  const content = filterContent(input);
  if (!content.ok) {
    return { ok: false, protectedNames: [], message: content.message };
  }

  return { ok: true, message: "", protectedNames: [] };
}
