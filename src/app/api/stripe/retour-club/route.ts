/** Retour après souscription au Club : enregistre l'abonnement puis redirige. */

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { synchroniser } from "@/lib/subscription";
import { getAppUrl } from "@/lib/appUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  if (id.startsWith("cs_")) {
    try {
      await Promise.race([
        (async () => {
          const s = await getStripe().checkout.sessions.retrieve(id);
          const sub = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
          if (sub) await synchroniser(sub);
        })(),
        new Promise((ok) => setTimeout(ok, 8000)),
      ]);
    } catch (e) {
      console.error("[club] retour :", String(e).slice(0, 160));
    }
  }
  return NextResponse.redirect(`${getAppUrl()}/club?bienvenue=1`, 303);
}
