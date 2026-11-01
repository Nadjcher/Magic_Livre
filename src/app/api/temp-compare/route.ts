/**
 * TEMPORAIRE — comparatif de modèles d'image (même héros, mêmes scènes).
 * Protégé par l'empreinte SHA-256 d'un secret jamais publié. À supprimer.
 */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { ILLUSTRATION_STYLES, BASE_IMAGE_PROMPT } from "@/lib/style_config";

export const runtime = "nodejs";
export const maxDuration = 300;
const HASH = "758bdd24f31cd6f600597b3d059a33af02341f091b4340764522a426a704c384";

const REF = "https://storilou.vercel.app/illustrations/feerique/hero.webp";
const SCENES = [
  "the boy running joyfully through a moonlit meadow chasing a glowing firefly, full body, dynamic running pose, side view",
  "the boy having a night picnic on a blanket with his grandmother (grey bun, round glasses, lavender cardigan) and a small round fluffy mint-green creature with big black eyes and two leaf-shaped antennas, everyone laughing",
  "wide shot seen from below: the boy climbing a giant ancient tree decorated with paper lanterns, reaching for a star caught in the branches",
];
const PERSO =
  "The child in the reference image is the hero of the book: keep EXACTLY the same character — same face, same curly brown hair, same skin tone, same cream pyjamas with tiny stars, same drawing style. Do NOT copy the reference pose or framing: draw a completely NEW scene. ";

const MODELES: Record<string, (prompt: string) => Record<string, unknown>> = {
  "fal-ai/nano-banana/edit": (p) => ({ prompt: p, image_urls: [REF], aspect_ratio: "16:9", output_format: "jpeg" }),
  "fal-ai/nano-banana-2/edit": (p) => ({ prompt: p, image_urls: [REF], aspect_ratio: "16:9", output_format: "jpeg", resolution: "1K" }),
  "bytedance/seedream/v5/lite/edit": (p) => ({ prompt: p, image_urls: [REF], image_size: "landscape_16_9", output_format: "jpeg" }),
  "fal-ai/flux-2-pro/edit": (p) => ({ prompt: p, image_urls: [REF], image_size: "landscape_16_9", output_format: "jpeg" }),
};

export async function GET(req: Request): Promise<Response> {
  const s = new URL(req.url).searchParams.get("s") ?? "";
  if (createHash("sha256").update(s).digest("hex") !== HASH) return new NextResponse("Non.", { status: 404 });
  const key = env.falApiKey();
  const style = ILLUSTRATION_STYLES.feerique.prompt;
  const jobs = Object.entries(MODELES).flatMap(([m, body]) =>
    SCENES.map(async (scene, i) => {
      const t = Date.now();
      try {
        const r = await fetch(`https://fal.run/${m}`, {
          method: "POST",
          headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(body(`${PERSO}Style: ${style}. Scene: ${scene}. ${BASE_IMAGE_PROMPT}`)),
          signal: AbortSignal.timeout(240_000),
        });
        const j = (await r.json()) as { images?: { url: string }[] };
        return { m, i, ok: r.ok, s: Math.round((Date.now() - t) / 1000), url: j.images?.[0]?.url ?? null, err: r.ok ? null : JSON.stringify(j).slice(0, 300) };
      } catch (e) {
        return { m, i, ok: false, s: Math.round((Date.now() - t) / 1000), url: null, err: String(e).slice(0, 200) };
      }
    }),
  );
  return NextResponse.json(await Promise.all(jobs));
}
