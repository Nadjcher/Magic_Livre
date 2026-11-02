/**
 * Aperçu gratuit du livre imprimé (même mise en page que le fichier envoyé à
 * l'imprimeur, en définition réduite) : couverture à plat + 30 pages.
 * Réservé au propriétaire du livre.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { safeFileName } from "@/lib/bookAccess";
import { imagesDuLivre } from "@/lib/print";
import { renderPrintPdf } from "@/lib/printBook";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const book = await prisma.book.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null, status: "ready" },
    select: { title: true, pages: true, child: { select: { firstName: true } } },
  });
  const parsed = storySchema.safeParse(book?.pages);
  if (!book || !parsed.success) return NextResponse.json({ error: "Livre introuvable." }, { status: 404 });

  const images = await imagesDuLivre(parsed.data, book.child.firstName, false);
  const pdf = await renderPrintPdf(parsed.data, book.child.firstName, images);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="apercu-${safeFileName(book.title).normalize("NFD").replace(/[^\x20-\x7E]/g, "")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
