/** TEMPORAIRE — exporte les illustrations du livre de démonstration (Léo, Noël). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { fetchAsDataUrl } from "@/lib/imageFetch";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "0454d7e307468574e96b12776400c3fbb1be3b09b4c2405ab37c529eea891457") return new NextResponse("Non.", { status: 404 });
  const b = await prisma.book.findFirst({ where: { title: "Le hoquet doré de la nuit de Noël", deletedAt: null, status: "ready" }, select: { pages: true } });
  const st = storySchema.safeParse(b?.pages);
  if (!st.success) return NextResponse.json({ erreur: "livre" });
  const i = Number(u.searchParams.get("i") ?? "-1");
  const ref = i < 0 ? st.data.couvertureUrl : st.data.pages[i]?.imageUrl;
  const data = await fetchAsDataUrl(ref, { maxPx: 1200, quality: 84 });
  return NextResponse.json({ n: st.data.pages.length, titre: st.data.titre, textes: i < 0 ? st.data.pages.map((p) => p.texte) : undefined, data });
}
