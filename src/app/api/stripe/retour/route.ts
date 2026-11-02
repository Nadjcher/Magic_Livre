/**
 * Retour de paiement Stripe : confirme la commande auprès de Stripe (en
 * quelques secondes au plus) puis redirige vers la boutique du livre.
 * Page légère et rapide : rien n'est calculé pendant l'affichage.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { confirmPaidSession } from "@/lib/stripe";
import { getAppUrl } from "@/lib/appUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  const bookId = (u.searchParams.get("book") ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
  const sessionId = u.searchParams.get("session_id") ?? "";
  const base = getAppUrl();
  if (!bookId) return NextResponse.redirect(`${base}/bibliotheque`, 303);

  const user = await getCurrentUser();
  if (user && sessionId.startsWith("cs_")) {
    const debut = Date.now();
    await Promise.race([
      confirmPaidSession(sessionId, user.id, bookId),
      new Promise((ok) => setTimeout(ok, 8000)),
    ]);
    console.log("[paiement] retour confirmé en", Date.now() - debut, "ms");
  }
  return NextResponse.redirect(`${base}/bibliotheque/${bookId}/boutique?paiement=succes`, 303);
}
