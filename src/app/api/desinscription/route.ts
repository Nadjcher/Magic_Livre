/**
 * Désinscription « en un clic » (RFC 8058) : les messageries (Gmail, Yahoo…)
 * envoient un POST sur l'adresse de l'en-tête List-Unsubscribe.
 */

import { NextResponse } from "next/server";
import { desinscrire, jetonValide } from "@/lib/campagnes";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  const email = (u.searchParams.get("e") ?? "").toLowerCase();
  const jeton = u.searchParams.get("t") ?? "";
  if (!email || !jetonValide(email, jeton)) return new NextResponse("Lien invalide.", { status: 400 });
  await desinscrire(email);
  return new NextResponse("Désinscription enregistrée.", { status: 200 });
}
