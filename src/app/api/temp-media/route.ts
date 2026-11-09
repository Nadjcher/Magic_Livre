/** TEMPORAIRE — couvertures illustrées des thèmes via fal. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "bf350198bab030b564243a03b84d3daefca2f7f7211375f731ff8e2ddd7c7a1d") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { prompt: string; refs?: string[]; ratio?: string };
  const r = await fetch("https://fal.run/fal-ai/nano-banana-2/edit", {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: b.prompt, image_urls: b.refs ?? [], aspect_ratio: b.ratio ?? "3:4", num_images: 1, output_format: "png" }),
    signal: AbortSignal.timeout(280_000),
  });
  const j = await r.json().catch(() => ({}));
  return NextResponse.json({ ok: r.ok, url: j.images?.[0]?.url ?? null, err: r.ok ? null : JSON.stringify(j).slice(0, 300) });
}
