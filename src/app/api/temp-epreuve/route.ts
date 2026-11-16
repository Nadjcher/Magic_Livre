/** TEMPORAIRE — jeu d'épreuve de la relectrice (+ sonde des modèles de vision). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { lancerEpreuve } from "@/lib/epreuveRelectrice";
import { env } from "@/lib/env";
export const runtime = "nodejs";
export const maxDuration = 300;
// 1×1 pixel : la sonde ne coûte presque rien.
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { ids?: string[]; modele?: string; sonde?: string[] };
  if (b.sonde) {
    const res = await Promise.all(
      b.sonde.map(async (m) => {
        const r = await fetch("https://fal.run/openrouter/router/vision", {
          method: "POST",
          headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: m, prompt: "Reply with the single word: ok", image_urls: [PIXEL], max_tokens: 5 }),
          signal: AbortSignal.timeout(60_000),
        }).catch((e) => ({ status: 0, text: async () => String(e) }) as unknown as Response);
        return { modele: m, status: r.status, corps: (await r.text()).slice(0, 300) };
      }),
    );
    return NextResponse.json(res);
  }
  return NextResponse.json(await lancerEpreuve(b));
}
