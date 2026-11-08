/** TEMPORAIRE — poids des livres en base (diagnostic de lenteur), sans donnée personnelle. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { migrateBookImagesToBlob } from "@/lib/bookImages";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "b766b55c5b09d02cdb1217adce4510df741ef0bc04d7e7b978ff8cdb539940c5") return new NextResponse("Non.", { status: 404 });
  if (u.searchParams.get("migrer") === "1") {
    const lourds = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Book" WHERE "deletedAt" IS NULL AND octet_length(pages::text) > 500000 LIMIT 6`;
    const faits: string[] = [];
    for (const { id } of lourds) {
      const b = await prisma.book.findUnique({ where: { id }, select: { pages: true } });
      const st = storySchema.safeParse(b?.pages);
      if (st.success) {
        await migrateBookImagesToBlob(id, st.data);
        faits.push(id.slice(-6));
      }
    }
    return NextResponse.json({ migres: faits });
  }
  const t0 = Date.now();
  const rows = await prisma.$queryRaw<{ id: string; total: number; cle: string; ko: number; dataurls: number }[]>`
    SELECT b.id, (octet_length(b.pages::text) / 1024)::int AS total, k.key AS cle, (octet_length(k.value::text) / 1024)::int AS ko,
           (length(k.value::text) - length(replace(k.value::text, 'data:image', ''))) / 10 AS dataurls
    FROM "Book" b, jsonb_each(b.pages) k
    WHERE b."deletedAt" IS NULL AND jsonb_typeof(b.pages) = 'object'
    ORDER BY b."createdAt" DESC`;
  const livres: Record<string, { total: number; cles: Record<string, string> }> = {};
  for (const r of rows) {
    const k = r.id.slice(-6);
    livres[k] ??= { total: r.total, cles: {} };
    if (r.ko > 20) livres[k].cles[r.cle] = `${r.ko} Ko${r.dataurls ? ` (${r.dataurls} images intégrées)` : ""}`;
  }
  const t1 = Date.now();
  await prisma.$queryRaw`SELECT id FROM "Book" WHERE "deletedAt" IS NULL AND pages->>'couvertureUrl' IS NOT NULL`;
  return NextResponse.json({ msLecture: t1 - t0, msCouvertures: Date.now() - t1, livres });
}
