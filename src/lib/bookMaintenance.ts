/**
 * Entretien des livres : marque « échoué » tout livre resté bloqué en
 * « génération » trop longtemps (fonction serverless tuée, timeout réseau…).
 *
 * La génération normale dure < 60 s (maxDuration). Au-delà du seuil ci-dessous,
 * un livre encore « generating » est forcément mort → on le libère pour que
 * l'utilisateur puisse le supprimer et réessayer, au lieu de rester bloqué.
 *
 * Appelé paresseusement à la lecture (bibliothèque, page du livre) : pas besoin
 * de tâche planifiée, fonctionne sur n'importe quel plan.
 */

import "server-only";
import { prisma } from "./prisma";

export const STALE_GENERATING_MS = 4 * 60 * 1000; // 4 minutes

/** Libère les livres de l'utilisateur bloqués en génération depuis trop longtemps. */
export async function failStaleBooks(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_GENERATING_MS);
  try {
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
