/** TEMPORAIRE — 4 illustrations de test du conte (FLUX.2 Pro). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { noterDepense } from "@/lib/budget";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { prompt: string; refs?: string[]; format?: string };
  const edit = Boolean(b.refs?.length);
  const r = await fetch(`https://fal.run/fal-ai/flux-2-pro${edit ? "/edit" : ""}`, {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: b.prompt, image_size: b.format ?? "landscape_16_9", output_format: "jpeg", ...(edit ? { image_urls: b.refs } : {}) }),
    signal: AbortSignal.timeout(150_000),
  });
  const j = (await r.json().catch(() => ({}))) as { images?: { url?: string }[] };
  if (r.ok) await noterDepense(edit ? 0.045 : 0.03);
  return NextResponse.json({ ok: r.ok, url: j.images?.[0]?.url ?? null, err: r.ok ? null : JSON.stringify(j).slice(0, 300) });
}
