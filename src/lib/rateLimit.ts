/**
 * Limitation du nombre de créations de livres par utilisateur et par jour,
 * afin de contrôler les coûts d'appel à l'IA.
 *
 * S'appuie sur la base de données (nombre de livres créés dans les dernières
 * 24 heures), ce qui reste robuste même en environnement sans serveur
 * (serverless) où la mémoire n'est pas partagée entre instances.
 */

import "server-only";
import { prisma } from "./prisma";
import { env } from "./env";

export interface RateLimitResult {
  allowed: boolean;
  /** Nombre de livres déjà créés dans la fenêtre de 24 h. */
  used: number;
  /** Limite quotidienne configurée. */
  limit: number;
  /** Message en français si la limite est atteinte. */
  message: string;
}

export async function checkDailyBookLimit(
  userId: string,
): Promise<RateLimitResult> {
  const limit = env.maxBooksPerDay();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const used = await prisma.book.count({
    where: {
      userId,
      createdAt: { gte: since },
    },
  });

  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      message: `Vous avez atteint la limite de ${limit} livres par jour. Revenez demain pour en créer de nouveaux.`,
    };
  }

  return { allowed: true, used, limit, message: "" };
}
