/** TEMPORAIRE — images de la page d'accueil (exemple fictif, style 3D). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateIllustration } from "@/lib/illustration";
import type { IllustrationStyle } from "@/lib/style_config";
export const runtime = "nodejs";
export const maxDuration = 300;
type Ref = { base64: string; mime: string };
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { scene?: string; traits?: string; personnages?: string; ref?: Ref; ancre?: Ref; seed?: number; style?: IllustrationStyle };
  if (!b.scene || !b.ref) return NextResponse.json({ err: "requête incomplète" }, { status: 400 });
  const r = await generateIllustration({
    style: b.style ?? "anim3d", scene: b.scene, heroName: "Léo", appearance: b.traits, recurringCharacters: b.personnages,
    referenceImage: b.ref, anchorImage: b.ancre, seed: b.seed ?? 4242, stocker: false, carre: true,
  });
  if (!r.base64) return NextResponse.json({ err: r.error ?? "échec" });
  return NextResponse.json({ image: `data:${r.mime ?? "image/jpeg"};base64,${r.base64}` });
}
