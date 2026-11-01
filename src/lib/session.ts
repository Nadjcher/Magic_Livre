/**
 * Helpers serveur pour récupérer l'utilisateur courant et vérifier le
 * consentement parental.
 */

import "server-only";
import { auth } from "./auth";
import { createHash } from "node:crypto";
import { prisma } from "./prisma";

/**
 * Empreinte courte du mot de passe, glissée dans le jeton de session. Quand le
 * mot de passe change (modification ou « mot de passe oublié »), l'empreinte
 * change aussi : toutes les sessions ouvertes ailleurs deviennent invalides.
 */
export function passwordFingerprint(passwordHash: string | null | undefined): string {
  if (!passwordHash) return "";
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

/**
 * Renvoie l'utilisateur connecté (depuis la base), ou null si non connecté.
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  // Session ouverte avant un changement de mot de passe → refusée.
  const pv = (session as { pv?: string }).pv;
  if (pv && pv !== passwordFingerprint(user.passwordHash)) return null;
  return user;
}

/**
 * Indique si l'utilisateur a enregistré son consentement parental.
 */
export function hasParentalConsent(user: {
  parentalConsentAt: Date | null;
} | null): boolean {
  return Boolean(user && user.parentalConsentAt);
}
