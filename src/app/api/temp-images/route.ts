/** TEMPORAIRE — images de la page d'accueil (scène 3D et personnages détourés). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { noterDepense } from "@/lib/budget";
import { generateIllustration } from "@/lib/illustration";
export const runtime = "nodejs";
export const maxDuration = 300;
type Ref = { base64: string; mime: string };

async function fal(endpoint: string, body: unknown): Promise<Record<string, unknown>> {
  const r = await fetch(`https://fal.run/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(200_000),
  });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error(`${endpoint} ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}
const premiere = (j: Record<string, unknown>) =>
  ((j.images as { url: string }[] | undefined)?.[0]?.url ?? (j.image as { url: string } | undefined)?.url) as string | undefined;

export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { mode?: "scene" | "sprite"; scene?: string; traits?: string; personnages?: string; ref?: Ref; ancre?: Ref; seed?: number; prompt?: string };
  try {
    if (b.mode === "sprite") {
      if (!b.prompt) return NextResponse.json({ err: "prompt" }, { status: 400 });
      const g = await fal("fal-ai/flux-2-pro", { prompt: b.prompt, image_size: "square_hd", output_format: "png", seed: b.seed ?? 4242 });
      await noterDepense(0.03);
      const url = premiere(g);
      if (!url) return NextResponse.json({ err: "génération" });
      const d = await fal("fal-ai/birefnet/v2", { image_url: url, model: "General Use (Heavy)", output_format: "png" });
      await noterDepense(0.005);
      const png = premiere(d);
      if (!png) return NextResponse.json({ err: "détourage" });
      const buf = Buffer.from(await (await fetch(png)).arrayBuffer());
      return NextResponse.json({ image: `data:image/png;base64,${buf.toString("base64")}` });
    }
    if (!b.scene || !b.ref) return NextResponse.json({ err: "requête incomplète" }, { status: 400 });
    const r = await generateIllustration({
      style: "anim3d", scene: b.scene, heroName: "Léo", appearance: b.traits, recurringCharacters: b.personnages,
      referenceImage: b.ref, anchorImage: b.ancre, seed: b.seed ?? 4242, stocker: false, carre: true,
    });
    if (!r.base64) return NextResponse.json({ err: r.error ?? "échec" });
    return NextResponse.json({ image: `data:${r.mime ?? "image/jpeg"};base64,${r.base64}` });
  } catch (e) {
    return NextResponse.json({ err: String(e).slice(0, 300) });
  }
}
