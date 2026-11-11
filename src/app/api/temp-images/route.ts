/** TEMPORAIRE — essai « circuit complet » : portrait PuLID d'après la photo, puis la page, puis la relectrice (Sonnet) qui compare au portrait. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { noterDepense } from "@/lib/budget";
import { requestPortrait } from "@/lib/faceIdentity";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { ILLUSTRATION_STYLES } from "@/lib/style_config";
export const runtime = "nodejs";
export const maxDuration = 300;
const H = () => ({ Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" });
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { photo: string; traits: string; scene: string; points: string[] };
  // 1. Portrait ressemblant (PuLID), photo convertie en JPEG.
  const photo = await fetchAsDataUrl(b.photo, { maxPx: 1024, quality: 90 });
  if (!photo) return NextResponse.json({ err: "photo illisible" });
  const p = await requestPortrait({ referenceImageUrl: photo, stylePrompt: ILLUSTRATION_STYLES.aquarelle?.prompt ?? "", appearance: b.traits });
  if (!p.image) return NextResponse.json({ err: `portrait : ${p.error}` });
  const portrait = `data:${p.image.mime};base64,${p.image.base64}`;
  // 2. La page, ancrée sur le portrait.
  const r = await fetch("https://fal.run/fal-ai/flux-2-pro/edit", {
    method: "POST",
    headers: H(),
    body: JSON.stringify({ prompt: b.scene, image_urls: [portrait], image_size: "square_hd", output_format: "jpeg" }),
    signal: AbortSignal.timeout(150_000),
  });
  const j = (await r.json().catch(() => ({}))) as { images?: { url?: string }[] };
  if (r.ok) await noterDepense(0.045);
  const page = j.images?.[0]?.url;
  if (!page) return NextResponse.json({ portrait, err: `page : ${JSON.stringify(j).slice(0, 300)}` });
  // 3. Relectrice : compare la page au portrait (jamais à la photo).
  const pageJpeg = await fetchAsDataUrl(page, { maxPx: 1024, quality: 85 });
  const v = await fetch("https://fal.run/openrouter/router/vision", {
    method: "POST",
    headers: H(),
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.5",
      prompt:
        "You are a strict art director for a personalised children's book. Image 1 is the approved HERO PORTRAIT (reference character). Image 2 is a book page to check. " +
        "For EACH check, answer true ONLY if clearly and fully satisfied; when in doubt, false. " +
        'Reply with JSON only: {"points": [{"q": "…", "ok": true|false, "why": "short, concrete"}]}\n' +
        b.points.map((x, i) => `${i + 1}. ${x}`).join("\n"),
      image_urls: [portrait, pageJpeg ?? page],
      max_tokens: 1200,
      temperature: 0,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const vj = (await v.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
  if (v.ok) await noterDepense(vj.usage?.cost ?? 0.008);
  let controle: unknown = vj.output ?? null;
  try {
    controle = JSON.parse(/\{[\s\S]*\}/.exec(vj.output ?? "")?.[0] ?? "null");
  } catch {}
  return NextResponse.json({ portrait, page, controle });
}
