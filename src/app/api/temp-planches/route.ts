/** TEMPORAIRE — planches (effacer, dessiner, valider, voir) et retouche de pages d'un livre. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { controlerRetouches, dessinerPlanches, effacerPlanche, histoireParId, lirePlanches, retoucherPage, validerPlanche } from "@/lib/planches";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { depensesRecentes } from "@/lib/budget";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { histoire?: string; action: string; cles?: string[]; bookId?: string; pages?: number[] };
  const h = histoireParId(b.histoire);
  if (b.action === "retoucher" && b.bookId && b.pages) {
    const book = await prisma.book.findUnique({ where: { id: b.bookId }, select: { pages: true } });
    const st = storySchema.safeParse(book?.pages);
    if (!st.success) return NextResponse.json({ err: "livre illisible" });
    let story = st.data;
    for (const i of b.pages) {
      const url = await retoucherPage(story, i);
      if (url) story = { ...story, couvertureUrl: i < 0 ? url : story.couvertureUrl, pages: story.pages.map((p, k) => (k === i ? { ...p, imageUrl: url } : p)) };
    }
    const r = await controlerRetouches({ ...story, planches: { ...story.planches!, retouchees: b.pages } }, Date.now() + 200_000);
    const fin = { ...r.story, planches: st.data.planches };
    await prisma.book.update({ where: { id: b.bookId }, data: { pages: fin } });
    const out: Record<string, string | null> = {};
    for (const i of b.pages) out[i < 0 ? "couverture" : `p${i + 1}`] = await fetchAsDataUrl(i < 0 ? fin.couvertureUrl : fin.pages[i]!.imageUrl, { maxPx: 768, quality: 85 });
    return NextResponse.json({ bilan: r.bilan, images: out, depenses: (await depensesRecentes())[0] });
  }
  if (!h) return NextResponse.json({ err: "histoire inconnue" });
  if (b.action === "effacer") for (const c of b.cles ?? []) await effacerPlanche(h.id, "anim3d", c);
  if (b.action === "valider") for (const c of b.cles ?? []) await validerPlanche(h.id, "anim3d", c, true);
  if (b.action === "dessiner") await dessinerPlanches(h, "anim3d", Date.now() + 250_000);
  const m = await lirePlanches(h.id, "anim3d");
  const out: Record<string, string | null> = {};
  for (const c of b.cles ?? []) out[c] = await fetchAsDataUrl(m.get(c)?.url, { maxPx: 768, quality: 85 });
  return NextResponse.json({ images: out, depenses: (await depensesRecentes())[0] });
}
