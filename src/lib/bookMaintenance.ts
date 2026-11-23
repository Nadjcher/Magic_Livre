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
import { EN_COURS } from "./illustrationStatus";

// Deux étapes de 5 min au plus (texte, puis illustrations) : au-delà de 12 min,
// la création est forcément interrompue.
// Écriture, relecture (avec réécritures, voire une seconde génération) et
// illustrations ont chacune leur exécution : on laisse 25 minutes avant d'abandonner.
export const STALE_GENERATING_MS = 25 * 60 * 1000;

/** Libère les livres de l'utilisateur bloqués en génération depuis trop longtemps. */
export async function failStaleBooks(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_GENERATING_MS);
  try {
    // Texte déjà écrit mais fabrication morte : le livre n'est PAS « prêt » (ses images manquent ou n'ont
    // pas été vérifiées). Il est retenu dans l'atelier ; l'administrateur est prévenu.
    // Un livre relancé (file d'attente, atelier) porte la date de sa relance : on ne le coupe pas en plein travail.
    const bloques = await prisma.book.findMany({
      where: { userId, status: "generating", createdAt: { lt: cutoff }, NOT: { pages: { equals: Prisma.DbNull } } },
      select: { id: true, errorMessage: true },
    });
    for (const b of bloques) {
      const relance = b.errorMessage?.startsWith(EN_COURS) ? Number(b.errorMessage.slice(EN_COURS.length)) : 0;
      if (relance > cutoff.getTime()) continue;
      const { retenirInterrompu } = await import("./bookPipeline");
      await retenirInterrompu(b.id, "fabrication restée bloquée plus de 25 minutes");
    }
    const enCours = bloques.map((b) => b.id);
    await prisma.book.updateMany({
      where: { userId, status: "generating", createdAt: { lt: cutoff }, id: { notIn: enCours } },
      data: {
        status: "failed",
        errorMessage:
          "La génération a pris trop de temps et a été interrompue. Supprimez ce livre et réessayez.",
      },
    });
    // Un livre acheté dont la complétion a été interrompue (exécution tuée) reste « en cours » pour
    // toujours, et sa clé de déblocage reste prise. Après 12 minutes : on libère, et l'atelier est prévenu.
    const figes = await prisma.book.findMany({
      where: { userId, status: "ready", errorMessage: { startsWith: EN_COURS } },
      select: { id: true, errorMessage: true },
    });
    for (const b of figes) {
      const depuis = Number(b.errorMessage!.slice(EN_COURS.length));
      if (!depuis || Date.now() - depuis < 12 * 60 * 1000) continue;
      const { liberer } = await import("./idempotence");
      await liberer(`debloquer:${b.id}`);
      await prisma.book.update({ where: { id: b.id }, data: { errorMessage: null } });
      const { alerterAdmin } = await import("./notifications");
      await alerterAdmin(
        "la complétion d'un livre a été interrompue",
        `Livre ${b.id} : ses dernières pages n'ont pas été dessinées. Le parent peut la relancer depuis la page du livre ; vérifiez aussi sa commande.`,
      ).catch(() => undefined);
    }
  } catch {
    /* non bloquant */
  }
}
