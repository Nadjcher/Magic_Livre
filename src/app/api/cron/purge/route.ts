/** Purge quotidienne des données arrivées au terme de leur durée de conservation (RGPD). */

import { NextResponse } from "next/server";
import { purger } from "@/lib/conservation";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const viaVercel = (req.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  if (secret ? auth !== `Bearer ${secret}` : !viaVercel) return new NextResponse("Non autorisé.", { status: 401 });
  // Passage quotidien : les livres en attente d'illustrations retentent leur chance.
  const { relancerEnAttente } = await import("@/lib/attenteIllustrations");
  const relances = await relancerEnAttente().catch(() => 0);
  return NextResponse.json({ ...(await purger()), relances });
}
