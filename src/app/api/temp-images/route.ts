/** TEMPORAIRE — image d'essai de la 3D sous la bible visuelle + relectrice (grille 3D). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { noterDepense } from "@/lib/budget";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { generateIllustration } from "@/lib/illustration";
import { grillePour } from "@/lib/bibleVisuelle";
import { buildIllustrationPrompt } from "@/lib/style_config";
export const runtime = "nodejs";
export const maxDuration = 300;
type Ref = { base64: string; mime: string };
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { ref?: Ref; traits?: string; scene?: string; personnages?: string };
  if (!b.ref || !b.scene) return NextResponse.json({ err: "requête incomplète" }, { status: 400 });
  const consigne = buildIllustrationPrompt({ style: "anim3d", scene: b.scene, heroName: "Léo", appearance: b.traits, recurringCharacters: b.personnages });
  const page = await generateIllustration({ style: "anim3d", scene: b.scene, heroName: "Léo", appearance: b.traits, recurringCharacters: b.personnages, anchorImage: b.ref, seed: 6161, stocker: false });
  if (!page.base64) return NextResponse.json({ err: page.error, consigne });
  const pageUrl = `data:${page.mime ?? "image/jpeg"};base64,${page.base64}`;
  const pageJpeg = (await fetchAsDataUrl(pageUrl, { maxPx: 1024, quality: 85 })) ?? pageUrl;
  const grille = grillePour("anim3d");
  const v = await fetch("https://fal.run/openrouter/router/vision", {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.5",
      prompt:
        "You are the strict art director of a children's picture book. Image 1 is the reference of the hero (" + (b.traits ?? "") + "). Image 2 is the book page to check. Character sheet: " + (b.personnages ?? "") + ". Scene requested: " + b.scene +
        "\nAnswer EACH question with yes or no and one short sentence describing what you SEE. When in doubt, answer no.\n" +
        grille.map((q, i) => `${i + 1}. ${q}`).join("\n") +
        '\nReply with JSON only: {"answers": [{"n": 1, "yes": true, "seen": "…"}]}',
      image_urls: [`data:${b.ref.mime};base64,${b.ref.base64}`, pageJpeg],
      max_tokens: 1500,
      temperature: 0,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const vj = (await v.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
  if (v.ok) await noterDepense(vj.usage?.cost ?? 0.008);
  return NextResponse.json({ page: pageUrl, controle: vj.output ?? null, consigne });
}
