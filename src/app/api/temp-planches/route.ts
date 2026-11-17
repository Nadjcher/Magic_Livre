/** TEMPORAIRE — état des planches et retouche de la couverture d'un livre. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { controlerRetouches, etatPlanches, histoireParId, retoucherPage } from "@/lib/planches";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { depensesRecentes } from "@/lib/budget";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { action: string; bookId?: string; histoire?: string };
  if (b.action === "etat") {
    const h = histoireParId(b.histoire)!;
    const e = await etatPlanches(h, "anim3d");
    return NextResponse.json({ total: e.total, dessinees: e.dessinees, validees: e.validees, nonValidees: e.planches.filter((p) => !p.valide).map((p) => p.cle) });
  }
  const book = await prisma.book.findUnique({ where: { id: b.bookId ?? "" }, select: { pages: true } });
  const st = storySchema.safeParse(book?.pages);
  if (!st.success) return NextResponse.json({ err: "livre illisible" });
  const story0 = { ...st.data, planches: { ...st.data.planches!, apparence: st.data.planches?.apparence ?? "a 5-year-old girl with long straight dark brown hair down to the shoulders, brown eyes, light olive skin" } };
  const url = await retoucherPage(story0, -1);
  if (!url) return NextResponse.json({ err: "retouche impossible" });
  const story = { ...story0, couvertureUrl: url };
  const r = await controlerRetouches({ ...story, planches: { ...story.planches, retouchees: [-1] } }, Date.now() + 120_000);
  const fin = { ...r.story, planches: story0.planches };
  await prisma.book.update({ where: { id: b.bookId! }, data: { pages: fin } });
  return NextResponse.json({ bilan: r.bilan, image: await fetchAsDataUrl(fin.couvertureUrl, { maxPx: 900, quality: 86 }), depenses: (await depensesRecentes())[0] });
}
