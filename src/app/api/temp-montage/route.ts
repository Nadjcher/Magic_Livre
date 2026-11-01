/** TEMPORAIRE — essai du montage fal (ffmpeg compose). Protégé par empreinte de secret. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(req: Request): Promise<Response> {
  const s = new URL(req.url).searchParams.get("s") ?? "";
  if (createHash("sha256").update(s).digest("hex") !== "89a9d0673b48e7230b48b7b7ffbf6d933cfc5f8d1724dfdc35bd6df52c16bc02") return new NextResponse("Non.", { status: 404 });
  const t = Date.now();
  if (new URL(req.url).searchParams.get("landing") === "1") {
    const h = { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" };
    const run = async (m: string, body: Record<string, unknown>) => {
      const r = await fetch(`https://fal.run/${m}`, { method: "POST", headers: h, body: JSON.stringify(body), signal: AbortSignal.timeout(200_000) });
      const j = (await r.json()) as { images?: { url: string }[] };
      return { ok: r.ok, url: j.images?.[0]?.url ?? null, err: r.ok ? null : JSON.stringify(j).slice(0, 300) };
    };
    const photo = await run("fal-ai/flux-2-pro", {
      prompt: "candid smartphone photo of a cheerful 5-year-old boy with curly light-brown hair, big brown eyes and freckles, wearing a mustard yellow t-shirt, sitting on the grass in a sunny family garden, natural daylight, shallow depth of field, authentic family snapshot, photorealistic",
      image_size: "portrait_4_3", output_format: "jpeg",
    });
    if (!photo.url) return NextResponse.json({ photo });
    const style = "high-end 3D animated feature film style children's book illustration (soft Pixar-like rendering), cinematic lighting, rich magical night-blue and lavender palette with warm lantern glow, highly detailed, no text";
    const perso = "The child in the reference photo is the hero: he must clearly look like him (same curly light-brown hair, brown eyes, freckles, face shape, age), same mustard yellow t-shirt and blue shorts. ";
    const [couv, p1, p2] = await Promise.all([
      run("fal-ai/nano-banana-2/edit", { prompt: perso + "Book cover scene: the boy walks into an enchanted forest at dusk holding a glowing paper lantern, a small friendly fox with a blue scarf at his side, fireflies and floating lanterns everywhere, wide composition with space at the top. " + style, image_urls: [photo.url], aspect_ratio: "4:3", output_format: "jpeg" }),
      run("fal-ai/nano-banana-2/edit", { prompt: perso + "The boy and the little fox with a blue scarf cross a wooden bridge over a sparkling stream under a huge full moon, lanterns reflecting in the water. " + style, image_urls: [photo.url], aspect_ratio: "16:9", output_format: "jpeg" }),
      run("fal-ai/nano-banana-2/edit", { prompt: perso + "The boy laughs while releasing dozens of glowing lanterns into the starry sky from a hilltop, the little fox with a blue scarf jumping with joy. " + style, image_urls: [photo.url], aspect_ratio: "16:9", output_format: "jpeg" }),
    ]);
    return NextResponse.json({ s: Math.round((Date.now() - t) / 1000), photo, couv, p1, p2 });
  }
  const r = await fetch("https://fal.run/fal-ai/ffmpeg-api/compose", {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(280_000),
    body: JSON.stringify({ tracks: [
      { id: "images", type: "video", keyframes: [
        { url: "https://v3b.fal.media/files/b/0ab0b74d/4O7gZDVJ7voRStaqxholM_output.mp4", timestamp: 0, duration: 5040 },
        { url: "https://v3b.fal.media/files/b/0ab0b74d/4O7gZDVJ7voRStaqxholM_output.mp4", timestamp: 5040, duration: 5040 } ] },
      { id: "voix", type: "audio", keyframes: [{ url: "https://v3b.fal.media/files/b/0ab0b74a/PROLhZEHSCl32QPoIft-H_output.mp3", timestamp: 400, duration: 4000 }] },
      { id: "musique", type: "audio", keyframes: [{ url: "https://storilou.vercel.app/musique/boucle-6400.mp3", timestamp: 0, duration: 6400 }, { url: "https://storilou.vercel.app/musique/boucle-3200.mp3", timestamp: 6400, duration: 3200 }] },
    ] }),
  });
  return NextResponse.json({ s: Math.round((Date.now() - t) / 1000), ok: r.ok, j: await r.json() });
}
