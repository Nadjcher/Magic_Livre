/**
 * Relecture notée d'une histoire (et réécritures), dans sa propre exécution,
 * puis livraison. Appel interne uniquement : corps signé (HMAC).
 */

import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { signatureValide } from "@/lib/bookPipeline";
import { relireEtLivrer, type Livraison } from "@/lib/livraison";
import type { Story } from "@/lib/storySchema";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  const corps = await req.text();
  if (!signatureValide(corps, req.headers.get("x-signature"))) {
    return new NextResponse("Non autorisé.", { status: 401 });
  }
  let donnees: { l: Livraison; story: Story };
  try {
    donnees = JSON.parse(corps) as { l: Livraison; story: Story };
  } catch {
    return new NextResponse("Requête invalide.", { status: 400 });
  }
  waitUntil(relireEtLivrer(donnees.l, donnees.story));
  return new NextResponse(null, { status: 202 });
}
