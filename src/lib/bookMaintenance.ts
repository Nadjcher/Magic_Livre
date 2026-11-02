/**
 * Entretien des livres : marque « échoué » tout livre resté bloqué en
 * « génération » trop longtemps (fonction serverless tuée, timeout réseau…).
 *
 * La génération est plafonnée à 5 min (maxDuration de /creer). Au-delà du seuil,
 * un livre encore « generating » est forcément mort → on le libère pour que
 * l'utilisateur puisse le supprimer et réessayer, au lieu de rester bloqué.
 *
 * Appelé paresseusement à la lecture (bibliothèque, page du livre) : pas besoin
 * de tâche planifiée, fonctionne sur n'importe quel plan.
 */

import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Deux étapes de 5 min au plus (texte, puis illustrations) : au-delà de 12 min,
// la création est forcément interrompue.
export const STALE_GENERATING_MS = 12 * 60 * 1000;

/** Libère les livres de l'utilisateur bloqués en génération depuis trop longtemps. */
export async function failStaleBooks(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_GENERATING_MS);
  try {
    // Texte déjà écrit : le livre devient lisible, les illustrations pourront
    // être complétées depuis sa page.
    await prisma.book.updateMany({
      where: { userId, status: "generating", createdAt: { lt: cutoff }, NOT: { pages: { equals: Prisma.DbNull } } },
      data: {
        status: "ready",
        errorMessage: "Illustrations manquantes : la création des images a été interrompue.",
      },
    });
    await prisma.book.updateMany({
      where: { userId, status: "generating", createdAt: { lt: cutoff } },
      data: {
        status: "failed",
        errorMessage:
          "La génération a pris trop de temps et a été interrompue. Supprimez ce livre et réessayez.",
      },
    });
  } catch {
    /* non bloquant */
  }
}
