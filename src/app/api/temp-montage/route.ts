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
