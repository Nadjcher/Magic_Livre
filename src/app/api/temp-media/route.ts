/** TEMPORAIRE — médias de la vidéo TikTok (images, voix, musique) via fal. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
export const runtime = "nodejs";
export const maxDuration = 300;
async function fal(path: string, body: unknown) {
  const r = await fetch(`https://fal.run/${path}`, {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(280_000),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "eb3aa7240c1aa7d824614d72eeabc3f90992730a5ffa99455b826cae807b995e") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { type: "image" | "voix" | "musique"; prompt?: string; refs?: string[]; texte?: string; modele?: string; duree?: number };
  if (b.type === "image") {
    const modele = b.modele ?? "fal-ai/nano-banana-2/edit";
    const r = await fal(modele, { prompt: b.prompt, image_urls: b.refs ?? [], ...(modele.includes("nano-banana") ? { aspect_ratio: "9:16" } : { image_size: "portrait_16_9" }), num_images: 1, output_format: "png" });
    return NextResponse.json({ ok: r.ok, url: r.j.images?.[0]?.url ?? null, err: r.ok ? null : JSON.stringify(r.j).slice(0, 300) });
  }
  if (b.type === "voix") {
    const r = await fal("fal-ai/elevenlabs/tts/multilingual-v2", { text: b.texte, voice: b.modele ?? "Matilda", language_code: "fr", stability: 0.55, style: 0.35, speed: 0.9 });
    return NextResponse.json({ ok: r.ok, url: r.j.audio?.url ?? null, err: r.ok ? null : JSON.stringify(r.j).slice(0, 300) });
  }
  const modele = b.modele ?? "fal-ai/lyria2";
  const r = await fal(modele, modele.includes("lyria") ? { prompt: b.prompt, negative_prompt: "vocals, drums, distortion" } : { prompt: b.prompt, seconds_total: b.duree ?? 40 });
  const url = r.j.audio?.url ?? r.j.audio_file?.url ?? null;
  return NextResponse.json({ ok: r.ok, url, err: r.ok ? null : JSON.stringify(r.j).slice(0, 300) });
}
