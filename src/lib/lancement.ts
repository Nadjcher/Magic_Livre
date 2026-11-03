/**
 * Pré-lancement : tant que les ventes ne sont pas ouvertes, la lecture reste
 * gratuite mais les achats sont fermés (sauf pour les administrateurs, qui
 * peuvent tout tester) et les visiteurs s'inscrivent sur une liste d'attente.
 *
 * Par défaut, les ventes sont ouvertes UNIQUEMENT avec une clé Stripe réelle
 * (sk_live) : en mode test, un visiteur pourrait sinon « payer » avec une carte
 * de test. Forçage possible : VENTES_OUVERTES=true / false.
 */

import "server-only";
import { prisma } from "./prisma";

export const DATE_OUVERTURE = process.env.DATE_OUVERTURE || "15 novembre";

export function ventesOuvertes(): boolean {
  const force = (process.env.VENTES_OUVERTES ?? "").toLowerCase();
  if (force === "true") return true;
  if (force === "false") return false;
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live");
}

export const MESSAGE_FERME = `Les achats ouvrent le ${DATE_OUVERTURE}. Votre livre reste lisible gratuitement d'ici là, et nous vous prévenons par email à l'ouverture.`;

let pret: Promise<void> | null = null;
function table(): Promise<void> {
  pret ??= prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "Waitlist" (email TEXT PRIMARY KEY, source TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "notifiedAt" TIMESTAMPTZ)`,
    )
    .then(() => undefined)
    .catch((e) => {
      pret = null;
      throw e;
    });
  return pret;
}

export async function inscrireAttente(email: string, source: string): Promise<void> {
  await table();
  await prisma.$executeRaw`INSERT INTO "Waitlist" (email, source) VALUES (${email}, ${source}) ON CONFLICT (email) DO NOTHING`;
}

export async function compterAttente(): Promise<{ liste: number; comptes: number }> {
  await table();
  const r = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "Waitlist"`;
  const comptes = await prisma.user.count();
  return { liste: Number(r[0]?.n ?? 0), comptes };
}

/** Destinataires de l'email d'ouverture pas encore prévenus (liste + comptes). */
export async function destinatairesOuverture(): Promise<string[]> {
  await table();
  const r = await prisma.$queryRaw<{ email: string }[]>`
    SELECT email FROM "Waitlist" WHERE "notifiedAt" IS NULL
    UNION
    SELECT u.email FROM "User" u WHERE NOT EXISTS (SELECT 1 FROM "Waitlist" w WHERE w.email = u.email AND w."notifiedAt" IS NOT NULL)`;
  return r.map((x) => x.email);
}

export async function marquerPrevenu(email: string): Promise<void> {
  await table();
  await prisma.$executeRaw`
    INSERT INTO "Waitlist" (email, source, "notifiedAt") VALUES (${email}, 'compte', NOW())
    ON CONFLICT (email) DO UPDATE SET "notifiedAt" = NOW()`;
}
