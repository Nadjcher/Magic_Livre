/** TEMPORAIRE — essai du circuit du héros avec un enfant FICTIF : photo fictive, traits, portrait dans le style, page. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { noterDepense } from "@/lib/budget";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { dessinerPortrait, traitsDepuisPhoto } from "@/lib/heros";
import { generateIllustration } from "@/lib/illustration";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { etape: string; prompt?: string; photo?: string; scene?: string; personnages?: string };
  if (b.etape === "photo") {
    const r = await fetch("https://fal.run/fal-ai/flux-2-pro", {
      method: "POST",
      headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: b.prompt, image_size: "portrait_4_3", output_format: "jpeg" }),
      signal: AbortSignal.timeout(120_000),
    });
    const j = (await r.json().catch(() => ({}))) as { images?: { url?: string }[] };
    if (r.ok) await noterDepense(0.03);
    return NextResponse.json({ url: j.images?.[0]?.url ?? null });
  }
  if (b.etape === "circuit" && b.photo) {
    const d = await fetchAsDataUrl(b.photo, { maxPx: 1024, quality: 88 });
    const m = d ? /^data:([^;]+);base64,(.+)$/.exec(d) : null;
    if (!m) return NextResponse.json({ err: "photo" });
    const photo = { mime: m[1] as string, base64: m[2] as string };
    const t0 = Date.now();
    const { traits, lumiere } = await traitsDepuisPhoto(photo);
    const p = await dessinerPortrait(photo, traits, "aquarelle");
    const msPortrait = Date.now() - t0;
    if ("erreur" in p) return NextResponse.json({ traits, lumiere, msPortrait, err: p.erreur });
    const page = await generateIllustration({
      style: "aquarelle",
      scene: b.scene ?? "",
      heroName: "Léa",
      appearance: traits,
      recurringCharacters: b.personnages,
      anchorImage: p.ref,
      seed: 4242,
    });
    return NextResponse.json({
      traits,
      lumiere,
      msPortrait,
      portrait: `data:${p.ref.mime};base64,${p.ref.base64}`,
      page: page.base64 ? `data:${page.mime ?? "image/jpeg"};base64,${page.base64}` : null,
      errPage: page.error ?? null,
    });
  }
  return NextResponse.json({ err: "étape" }, { status: 400 });
}
