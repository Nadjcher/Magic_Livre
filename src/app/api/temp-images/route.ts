/** TEMPORAIRE — image de contrôle : illustration d'après une photo (FLUX.2 Pro Edit) + relectrice d'images (Claude Sonnet). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { noterDepense } from "@/lib/budget";
export const runtime = "nodejs";
export const maxDuration = 300;
const H = () => ({ Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" });
type Point = { q: string; ok: boolean; why?: string };
async function verifier(photo: string, url: string, points: string[]): Promise<{ points?: Point[] }> {
  const prompt =
    "You are a strict art director for a personalised children's book. Image 1 is the PHOTO of the real child. Image 2 is the ILLUSTRATION to check. " +
    "For EACH check, look carefully and answer true ONLY if it is clearly and fully satisfied; when in doubt, answer false. " +
    'Reply with JSON only: {"points": [{"q": "…", "ok": true|false, "why": "short, concrete"}]}\n' +
    points.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const r = await fetch("https://fal.run/openrouter/router/vision", {
    method: "POST",
    headers: H(),
    body: JSON.stringify({ model: "anthropic/claude-sonnet-4.5", prompt, image_urls: [photo, url], max_tokens: 1200, temperature: 0 }),
    signal: AbortSignal.timeout(90_000),
  });
  const j = (await r.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
  if (r.ok) await noterDepense(j.usage?.cost ?? 0.008);
  try {
    return JSON.parse(/\{[\s\S]*\}/.exec(j.output ?? "")?.[0] ?? "{}");
  } catch {
    return {};
  }
}
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { prompt: string; points: string[]; photo: string };
  const essais: { url: string | null; controle: unknown }[] = [];
  let prompt = b.prompt;
  for (let i = 0; i < 2; i++) {
    const r = await fetch("https://fal.run/fal-ai/flux-2-pro/edit", {
      method: "POST",
      headers: H(),
      body: JSON.stringify({ prompt, image_urls: [b.photo], image_size: "square_hd", output_format: "jpeg" }),
      signal: AbortSignal.timeout(150_000),
    });
    const j = (await r.json().catch(() => ({}))) as { images?: { url?: string }[] };
    if (r.ok) await noterDepense(0.045);
    const url = j.images?.[0]?.url ?? null;
    if (!url) return NextResponse.json({ essais, err: JSON.stringify(j).slice(0, 300) });
    const c = await verifier(b.photo, url, b.points);
    essais.push({ url, controle: c });
    const rates = (c.points ?? []).filter((p) => !p.ok);
    if (c.points?.length && !rates.length) break;
    prompt = `${b.prompt} IMPORTANT CORRECTIONS: ${rates.map((p) => `${p.q} (${p.why ?? ""})`).join("; ")}`;
  }
  return NextResponse.json({ essais });
}
