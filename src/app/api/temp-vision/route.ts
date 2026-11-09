/** TEMPORAIRE — essai du contrôle visuel des illustrations. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { prompt: string; system?: string; images: string[]; model: string };
  const t = Date.now();
  const r = await fetch("https://fal.run/openrouter/router/vision", {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: b.prompt, system_prompt: b.system, image_urls: b.images, model: b.model, max_tokens: 1500, temperature: 0 }),
    signal: AbortSignal.timeout(110_000),
  });
  const j = await r.json().catch(() => ({}));
  return NextResponse.json({ ok: r.ok, ms: Date.now() - t, output: j.output ?? null, cost: j.usage?.cost ?? null, err: r.ok ? null : JSON.stringify(j).slice(0, 400) });
}
