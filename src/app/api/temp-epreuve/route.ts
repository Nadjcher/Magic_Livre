/** TEMPORAIRE — jeu d'épreuve de la relectrice. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { lancerEpreuve } from "@/lib/epreuveRelectrice";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { ids?: string[]; modele?: string };
  return NextResponse.json(await lancerEpreuve(b));
}
