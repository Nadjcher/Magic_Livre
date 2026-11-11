/** TEMPORAIRE — image d'essai du style de la maison + relectrice d'images (grille de la bible visuelle). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { noterDepense } from "@/lib/budget";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { generateIllustration } from "@/lib/illustration";
import { GRILLE_IMAGES } from "@/lib/bibleVisuelle";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { photo: string; traits: string; scene: string; personnages: string };
  const d = await fetchAsDataUrl(b.photo, { maxPx: 1024, quality: 88 });
  const m = d ? /^data:([^;]+);base64,(.+)$/.exec(d) : null;
  if (!m) return NextResponse.json({ err: "photo" });
  const ref = { mime: m[1] as string, base64: m[2] as string };
  const page = await generateIllustration({ style: "maison", scene: b.scene, heroName: "Léa", appearance: b.traits, recurringCharacters: b.personnages, referenceImage: ref, seed: 5151 });
  if (!page.base64) return NextResponse.json({ err: page.error });
  const pageUrl = `data:${page.mime ?? "image/jpeg"};base64,${page.base64}`;
  const pageJpeg = (await fetchAsDataUrl(pageUrl, { maxPx: 1024, quality: 85 })) ?? pageUrl;
  const v = await fetch("https://fal.run/openrouter/router/vision", {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.5",
      prompt:
        "You are the strict art director of a children's picture book. Image 1 is the reference of the hero (" + b.traits + "). Image 2 is the book page to check. Scene requested: " + b.scene +
        "\nAnswer EACH question with yes or no and one short sentence describing what you SEE. When in doubt, answer no.\n" +
        GRILLE_IMAGES.map((q, i) => `${i + 1}. ${q}`).join("\n") +
        '\nReply with JSON only: {"answers": [{"n": 1, "yes": true, "seen": "…"}]}',
      image_urls: [`data:${ref.mime};base64,${ref.base64}`, pageJpeg],
      max_tokens: 1500,
      temperature: 0,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const vj = (await v.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
  if (v.ok) await noterDepense(vj.usage?.cost ?? 0.008);
  return NextResponse.json({ page: pageUrl, controle: vj.output ?? null });
}
