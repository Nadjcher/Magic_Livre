/** TEMPORAIRE — livre complet de test (histoire maîtresse) et son PDF. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { dessinerPortrait } from "@/lib/heros";
import { maitressePour } from "@/lib/histoiresMaitresses";
import { histoireDepuisMaitresse } from "@/lib/maitresseGenerateur";
import { illustrateStory } from "@/lib/storyGenerator";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { renderStoryPdf } from "@/lib/pdf";
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
    const img = (x: string | null | undefined) => fetchAsDataUrl(x, { maxPx: 1100, quality: 86 });
    const pages = await Promise.all(story.pages.map(async (p) => ({ ...p, imageUrl: await img(p.imageUrl) })));
    const complet = { ...story, couvertureUrl: await img(story.couvertureUrl), pages, fiches: undefined };
    return NextResponse.json({ story: complet, imageReport });
  }
  if (b.mode === "pdf" && b.story) {
    const pdf = await renderStoryPdf(b.story, b.req?.childFirstName ?? "Léo");
    return NextResponse.json({ pdf: Buffer.from(pdf).toString("base64") });
  }
  return NextResponse.json({ err: "requête incomplète" }, { status: 400 });
}
