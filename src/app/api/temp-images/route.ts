/** TEMPORAIRE — test de livres complets (histoires maîtresses), comme pour un client. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { dessinerPortrait } from "@/lib/heros";
import { maitressePour } from "@/lib/histoiresMaitresses";
import { histoireDepuisMaitresse } from "@/lib/maitresseGenerateur";
import { illustrateStory } from "@/lib/storyGenerator";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import type { Story } from "@/lib/storySchema";
import type { StoryRequest } from "@/lib/storyPrompt";
import type { IllustrationStyle } from "@/lib/style_config";
export const runtime = "nodejs";
export const maxDuration = 300;
type Ref = { base64: string; mime: string };
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { mode?: string; photo?: Ref; traits?: string; style?: IllustrationStyle; req?: StoryRequest; story?: Story; portrait?: Ref };
  if (b.mode === "portrait" && b.photo && b.style) {
    const r = await dessinerPortrait(b.photo, b.traits ?? "", b.style);
    return NextResponse.json("erreur" in r ? { err: r.erreur } : { portrait: r.ref });
  }
  if (b.mode === "texte" && b.req) {
    const h = maitressePour(b.req.themeId, b.req.childAge);
    if (!h) return NextResponse.json({ err: "pas d'histoire maîtresse" });
    return NextResponse.json({ story: await histoireDepuisMaitresse(h, b.req) });
  }
  if (b.mode === "illustrer" && b.req && b.story) {
    const { story, imageReport } = await illustrateStory(b.story, b.req, b.portrait ?? null);
    const petit = (x: string | null | undefined) => fetchAsDataUrl(x, { maxPx: 640, quality: 80 });
    const pages = await Promise.all(story.pages.map(async (p) => ({ ...p, imageUrl: await petit(p.imageUrl) })));
    const fiches = story.fiches
      ? { heros: await petit(story.fiches.heros), cast: Object.fromEntries(await Promise.all(Object.entries(story.fiches.cast ?? {}).map(async ([k, v]) => [k, await petit(v)]))) }
      : null;
    return NextResponse.json({ story: { ...story, couvertureUrl: await petit(story.couvertureUrl), pages, fiches }, imageReport });
  }
  return NextResponse.json({ err: "requête incomplète" }, { status: 400 });
}
