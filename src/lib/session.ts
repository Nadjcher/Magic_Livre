/**
 * Helpers serveur pour récupérer l'utilisateur courant et vérifier le
 * consentement parental.
 */

import { waitUntil } from "@vercel/functions";
import { noterActivite } from "./conservation";
import "server-only";
import { cache } from "react";
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
/** Mise en cache pour la durée d'une requête (en-tête + page = une seule lecture). */
export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  // Session ouverte avant un changement de mot de passe → refusée.
  const pv = (session as { pv?: string }).pv;
  if (pv && pv !== passwordFingerprint(user.passwordHash)) return null;
  // Dernière activité (durée de conservation des comptes inactifs), en arrière-plan.
  waitUntil(noterActivite(user.id));
  return user;
});

/**
 * Indique si l'utilisateur a enregistré son consentement parental.
 */
export function hasParentalConsent(user: {
  parentalConsentAt: Date | null;
} | null): boolean {
  return Boolean(user && user.parentalConsentAt);
}
