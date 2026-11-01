/** TEMPORAIRE — essai du montage fal avec silences WAV. Protégé par empreinte de secret. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
export const runtime = "nodejs";
export const maxDuration = 300;
const B = "https://storilou.vercel.app/musique/";
export async function GET(req: Request): Promise<Response> {
  const s = new URL(req.url).searchParams.get("s") ?? "";
  if (createHash("sha256").update(s).digest("hex") !== "919736b8ba33e37582c7a624aab11b22363344ac348e8913ec17988e606101b0") return new NextResponse("Non.", { status: 404 });
  const r = await fetch("https://fal.run/fal-ai/ffmpeg-api/compose", {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(280_000),
    body: JSON.stringify({ tracks: [
      { id: "images", type: "video", keyframes: [{ url: "https://v3b.fal.media/files/b/0ab0b74d/4O7gZDVJ7voRStaqxholM_output.mp4", timestamp: 0, duration: 5040 }, { url: "https://v3b.fal.media/files/b/0ab0b74d/4O7gZDVJ7voRStaqxholM_output.mp4", timestamp: 5040, duration: 5040 }] },
      { id: "voix", type: "audio", keyframes: [
        { url: B + "silence-3200.mp3", timestamp: 0, duration: 3200 },
        { url: B + "silence-400.mp3", timestamp: 3200, duration: 400 },
        { url: B + "silence-200.mp3", timestamp: 3600, duration: 200 },
        { url: "https://v3b.fal.media/files/b/0ab0b74a/PROLhZEHSCl32QPoIft-H_output.mp3", timestamp: 3800, duration: 4000 },
        { url: B + "silence-1600.mp3", timestamp: 7800, duration: 1600 } ] },
    ] }),
  });
  return NextResponse.json({ ok: r.ok, j: await r.json() });
}
