/** TEMPORAIRE — test d'entrée des styles : la page 7 du Petit Poucet dans un style donné. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateIllustration } from "@/lib/illustration";
import { ILLUSTRATION_STYLES, type IllustrationStyle } from "@/lib/style_config";
export const runtime = "nodejs";
export const maxDuration = 300;
type Ref = { base64: string; mime: string };
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { ref?: Ref; traits?: string; scene?: string; personnages?: string; style?: string };
  if (!b.ref || !b.scene || !b.style || !(b.style in ILLUSTRATION_STYLES)) return NextResponse.json({ err: "requête incomplète" }, { status: 400 });
  const page = await generateIllustration({ style: b.style as IllustrationStyle, scene: b.scene, heroName: "Léo", appearance: b.traits, recurringCharacters: b.personnages, referenceImage: b.ref, seed: 7171, stocker: false });
  if (!page.base64) return NextResponse.json({ err: page.error });
  return NextResponse.json({ page: `data:${page.mime ?? "image/jpeg"};base64,${page.base64}` });
}
