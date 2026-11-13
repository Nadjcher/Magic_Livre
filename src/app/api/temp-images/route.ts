/** TEMPORAIRE — quatre scènes corrigées du Petit Poucet + relecture. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateIllustration } from "@/lib/illustration";
import { verifier } from "@/lib/controleIllustrations";
import { grillePour, CONSIGNE_COUVERTURE } from "@/lib/bibleVisuelle";
import { fetchAsDataUrl } from "@/lib/imageFetch";
export const runtime = "nodejs";
export const maxDuration = 300;
type Ref = { base64: string; mime: string };
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { scene: string; couverture?: boolean; titre?: string; traits: string; personnages: string; ancre: Ref; heros: Ref; cast: { name: string; base64: string; mime: string; description: string }[]; seed: number };
  const scene = b.couverture ? `Book cover illustration for the story "${b.titre}": ${b.scene}. ${CONSIGNE_COUVERTURE}` : b.scene;
  const r = await generateIllustration({ style: "anim3d", scene, heroName: "Léo", appearance: b.traits, recurringCharacters: b.personnages, anchorImage: b.ancre, castRefs: b.cast.map(({ name, base64, mime }) => ({ name, base64, mime })), seed: b.seed, stocker: false });
  if (!r.base64) return NextResponse.json({ err: r.error });
  const page = { base64: r.base64, mime: r.mime ?? "image/jpeg" };
  const petit = await fetchAsDataUrl(`data:${page.mime};base64,${page.base64}`, { maxPx: 768, quality: 80 });
  const m = /^data:([^;]+);base64,(.+)$/.exec(petit ?? "");
  const v = await verifier({ nom: "Léo", description: b.personnages.slice(0, 220), image: b.heros }, b.cast.map((c) => ({ nom: c.name, description: c.description, image: { base64: c.base64, mime: c.mime } })), m ? { mime: m[1]!, base64: m[2]! } : page, b.scene, grillePour("anim3d"));
  return NextResponse.json({ image: `data:${page.mime};base64,${page.base64}`, verdict: v });
}
