/**
 * Mise à jour du statut des commandes en SQL direct (une seule requête,
 * passée par HTTP) : plus fiable que les écritures transactionnelles du pilote
 * Neon, qui échouaient parfois (« Connection terminated unexpectedly »), si bien
 * que des paiements confirmés par Stripe restaient « en attente ».
 */

import "server-only";
import { prisma } from "./prisma";

/** Passe une commande à « payée » (si elle ne l'est pas déjà). Renvoie true si elle vient de l'être. */
export async function marquerPayee(
  orderId: string,
  opts: { sessionId?: string; userId?: string; bookId?: string } = {},
): Promise<boolean> {
  for (let essai = 0; essai < 3; essai++) {
    try {
      const n = await prisma.$executeRaw`
        UPDATE "Order"
        SET status = 'paid'::"OrderStatus",
            "stripeSessionId" = COALESCE(${opts.sessionId ?? null}, "stripeSessionId")
        WHERE id = ${orderId}
          AND status <> 'paid'::"OrderStatus"
          AND (${opts.userId ?? null}::text IS NULL OR "userId" = ${opts.userId ?? null})
          AND (${opts.bookId ?? null}::text IS NULL OR "bookId" = ${opts.bookId ?? null})`;
      return n > 0;
    } catch (e) {
      console.error("[commande] marquage payé, essai", essai + 1, String(e).slice(0, 160));
      await new Promise((ok) => setTimeout(ok, 500 * (essai + 1)));
    }
  }
  return false;
}

/** Passe une commande en attente à « échouée » (session expirée). */
export async function marquerEchouee(orderId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Order" SET status = 'failed'::"OrderStatus"
    WHERE id = ${orderId} AND status = 'pending'::"OrderStatus"`.catch(() => 0);
}
