/**
 * TEMPORAIRE — génère l'aperçu d'un style d'illustration (même scène pour tous
 * les styles) pour la galerie du studio. Protégé : seule l'empreinte SHA-256
 * du secret figure ici. À supprimer une fois les aperçus générés.
 */

import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { generateIllustration } from "@/lib/illustration";
import { ILLUSTRATION_STYLES, type IllustrationStyle } from "@/lib/style_config";

export const runtime = "nodejs";
export const maxDuration = 120;

const KEY_SHA256 = "087b982cee77a14e3e714766013667ec5871676834710a888ddcc9f3b007570a";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  if (createHash("sha256").update(key).digest("hex") !== KEY_SHA256) {
    return new NextResponse("Interdit.", { status: 403 });
  }
  const style = url.searchParams.get("style") as IllustrationStyle;
  if (!(style in ILLUSTRATION_STYLES)) return new NextResponse("Style inconnu.", { status: 400 });

  const r = await generateIllustration({
    style,
    heroName: "Léo",
    appearance: "a 6-year-old boy with curly brown hair and a green scarf",
    scene:
      "Léo and a small friendly orange fox discover a softly glowing lantern in a forest clearing at dusk, " +
      "wonder on their faces, medium shot",
    seed: 7,
  });
  const m = r.imageUrl ? /^data:([^;]+);base64,(.+)$/.exec(r.imageUrl) : null;
  if (!m) return NextResponse.json({ error: "génération échouée", imageUrl: r.imageUrl?.slice(0, 80) }, { status: 502 });
  return new NextResponse(new Uint8Array(Buffer.from(m[2] as string, "base64")), {
    headers: { "Content-Type": m[1] as string, "Cache-Control": "no-store" },
  });
}
