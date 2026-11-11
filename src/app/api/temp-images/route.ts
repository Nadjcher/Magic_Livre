/** TEMPORAIRE — test de style : une image (FLUX.2 Pro, carré) + relectrice d'images (Gemini Flash). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { noterDepense } from "@/lib/budget";
export const runtime = "nodejs";
export const maxDuration = 300;
const H = () => ({ Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" });
async function verifier(url: string, points: string[]) {
  const prompt =
    "You are a strict art director checking a children's book illustration. For EACH check below, look carefully at the image and answer true only if it is clearly satisfied. " +
    'Reply with JSON only: {"points": [{"q": "…", "ok": true|false, "why": "short"}]}\n' +
    points.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const r = await fetch("https://fal.run/openrouter/router/vision", {
    method: "POST",
    headers: H(),
    body: JSON.stringify({ model: "google/gemini-2.5-flash", prompt, image_urls: [url], max_tokens: 800, temperature: 0 }),
    signal: AbortSignal.timeout(60_000),
  });
  const j = (await r.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
  if (r.ok) await noterDepense(j.usage?.cost ?? 0.001);
  try {
    return JSON.parse(/\{[\s\S]*\}/.exec(j.output ?? "")?.[0] ?? "{}") as { points?: { q: string; ok: boolean; why?: string }[] };
  } catch {
    return {};
  }
}
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { prompt: string; points: string[] };
  const essais: { url: string | null; controle: unknown }[] = [];
  let prompt = b.prompt;
  for (let i = 0; i < 2; i++) {
    const r = await fetch("https://fal.run/fal-ai/flux-2-pro", {
      method: "POST",
      headers: H(),
      body: JSON.stringify({ prompt, image_size: "square_hd", output_format: "jpeg" }),
      signal: AbortSignal.timeout(150_000),
    });
    const j = (await r.json().catch(() => ({}))) as { images?: { url?: string }[] };
    if (r.ok) await noterDepense(0.03);
    const url = j.images?.[0]?.url ?? null;
    if (!url) return NextResponse.json({ essais, err: JSON.stringify(j).slice(0, 300) });
    const c = await verifier(url, b.points);
    essais.push({ url, controle: c });
    const rates = (c.points ?? []).filter((p) => !p.ok);
    if (!rates.length) break;
    prompt = `${b.prompt} IMPORTANT CORRECTIONS: ${rates.map((p) => `${p.q} (${p.why ?? ""})`).join("; ")}`;
  }
  return NextResponse.json({ essais });
}
