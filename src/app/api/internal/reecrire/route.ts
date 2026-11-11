/**
 * Deuxième génération complète d'une histoire (motif éliminatoire à la première),
 * dans sa propre exécution. Appel interne uniquement : corps signé (HMAC).
 */

import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { signatureValide } from "@/lib/bookPipeline";
import { secondeGeneration, type Livraison } from "@/lib/livraison";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  const corps = await req.text();
  if (!signatureValide(corps, req.headers.get("x-signature"))) {
    return new NextResponse("Non autorisé.", { status: 401 });
  }
  let l: Livraison;
  try {
    l = JSON.parse(corps) as Livraison;
  } catch {
    return new NextResponse("Requête invalide.", { status: 400 });
  }
  waitUntil(secondeGeneration(l));
  return new NextResponse(null, { status: 202 });
}
