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
import { prisma } from "./prisma";

export const STALE_GENERATING_MS = 6 * 60 * 1000; // 6 minutes (> durée max de 5 min)

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
