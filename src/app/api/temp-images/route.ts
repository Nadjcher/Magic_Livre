/** TEMPORAIRE — jeu d'épreuve de la relectrice et relecture du livre de test. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { lancerEpreuve } from "@/lib/epreuveRelectrice";
import { controlerIllustrations } from "@/lib/controleIllustrations";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import type { Story } from "@/lib/storySchema";
import type { StoryRequest } from "@/lib/storyPrompt";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { mode?: string; story?: Story; req?: StoryRequest };
  if (b.mode === "epreuve") return NextResponse.json(await lancerEpreuve());
  if (b.mode === "controler" && b.story && b.req) {
    const { story, bilan } = await controlerIllustrations(b.story, b.req, Date.now() + 270_000);
    const petit = (x: string | null | undefined) => fetchAsDataUrl(x, { maxPx: 640, quality: 80 });
    const pages = await Promise.all(story.pages.map(async (p) => ({ ...p, imageUrl: await petit(p.imageUrl) })));
    return NextResponse.json({ story: { ...story, couvertureUrl: await petit(story.couvertureUrl), pages }, bilan });
  }
  return NextResponse.json({ err: "requête incomplète" }, { status: 400 });
}
