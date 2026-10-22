/**
 * Helpers serveur pour récupérer l'utilisateur courant et vérifier le
 * consentement parental.
 */

import "server-only";
import { auth } from "./auth";
import { prisma } from "./prisma";

/**
 * Renvoie l'utilisateur connecté (depuis la base), ou null si non connecté.
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

/**
 * Indique si l'utilisateur a enregistré son consentement parental.
 */
export function hasParentalConsent(user: {
  parentalConsentAt: Date | null;
} | null): boolean {
  return Boolean(user && user.parentalConsentAt);
}
