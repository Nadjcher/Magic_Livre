/**
 * Idempotence : garantir qu'une action « une seule fois » (traiter un paiement,
 * lancer une impression…) ne s'exécute qu'une fois, même si plusieurs appels
 * arrivent en même temps (webhook Stripe + retour du client + nouvel essai).
 *
 * Principe : une table de « jetons ». Le premier appel qui insère la clé gagne ;
 * les suivants voient qu'elle existe déjà et s'arrêtent. L'insertion est
 * atomique côté base (clé primaire), donc sans course possible.
 */

import "server-only";
import { prisma } from "./prisma";

let tablePrete: Promise<void> | null = null;
function assurerTable(): Promise<void> {
  tablePrete ??= prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "Traitement" (
        cle TEXT PRIMARY KEY,
        "creeLe" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )
    .then(() => undefined)
    .catch((e) => {
      tablePrete = null;
      throw e;
    });
  return tablePrete;
}

/** Réserve la clé. Renvoie true pour le PREMIER appelant seulement. */
export async function reserver(cle: string): Promise<boolean> {
  await assurerTable();
  const n = await prisma.$executeRaw`
    INSERT INTO "Traitement" (cle) VALUES (${cle}) ON CONFLICT (cle) DO NOTHING`;
  return n > 0;
}

/** Libère la clé (après un échec, pour qu'un nouvel essai puisse refaire l'action). */
export async function liberer(cle: string): Promise<void> {
  await assurerTable();
  await prisma.$executeRaw`DELETE FROM "Traitement" WHERE cle = ${cle}`.catch(() => 0);
}
