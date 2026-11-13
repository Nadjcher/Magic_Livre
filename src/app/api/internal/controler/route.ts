/**
 * Étape 3 de la création d'un livre (relecture des images), dans sa propre exécution.
 * Appel interne uniquement : le corps doit être signé (HMAC, secret serveur).
 */

import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { controlerLivre, signatureValide, type EtapeControle } from "@/lib/bookPipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  const corps = await req.text();
  if (!signatureValide(corps, req.headers.get("x-signature"))) {
    return new NextResponse("Non autorisé.", { status: 401 });
  }
  let etape: EtapeControle;
  try {
    etape = JSON.parse(corps) as EtapeControle;
  } catch {
    return new NextResponse("Requête invalide.", { status: 400 });
  }
  waitUntil(controlerLivre(etape));
  return new NextResponse(null, { status: 202 });
}
