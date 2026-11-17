/** TEMPORAIRE — retouche de la couverture d'un livre. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { controlerRetouches, retoucherPage } from "@/lib/planches";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { depensesRecentes } from "@/lib/budget";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { bookId: string };
  const book = await prisma.book.findUnique({ where: { id: b.bookId }, select: { pages: true } });
  const st = storySchema.safeParse(book?.pages);
  if (!st.success) return NextResponse.json({ err: "livre illisible" });
  const url = await retoucherPage(st.data, -1);
  if (!url) return NextResponse.json({ err: "retouche impossible" });
  const story = { ...st.data, couvertureUrl: url };
  const r = await controlerRetouches({ ...story, planches: { ...story.planches!, retouchees: [-1] } }, Date.now() + 120_000);
  const fin = { ...r.story, planches: st.data.planches };
  await prisma.book.update({ where: { id: b.bookId }, data: { pages: fin } });
  return NextResponse.json({ bilan: r.bilan, image: await fetchAsDataUrl(fin.couvertureUrl, { maxPx: 900, quality: 86 }), depenses: (await depensesRecentes())[0] });
}
