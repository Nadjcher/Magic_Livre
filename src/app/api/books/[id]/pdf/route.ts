/**
 * Téléchargement du PDF d'un livre.
 *
 * Autorisé UNIQUEMENT si : l'utilisateur est connecté, le livre lui appartient,
 * il est « ready », et une commande « paid » existe pour ce livre (paiement
 * validé par le webhook Stripe signé). Aucun filigrane.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { renderStoryPdf } from "@/lib/pdf";
import { storySchema } from "@/lib/storySchema";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const book = await prisma.book.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null },
  });

  if (!book) {
    return NextResponse.json({ error: "Livre introuvable." }, { status: 404 });
  }

  if (book.status !== "ready" || !book.pages) {
    return NextResponse.json(
      { error: "Le livre n'est pas encore prêt." },
      { status: 409 },
    );
  }

  // Vérifie qu'un paiement a bien été validé pour ce livre.
  const paidOrder = await prisma.order.findFirst({
    where: { bookId: book.id, userId: user.id, status: "paid" },
  });

  if (!paidOrder) {
    return NextResponse.json(
      { error: "Le téléchargement nécessite un paiement validé." },
      { status: 402 },
    );
  }

  // Valide les pages stockées avant le rendu.
  const parsed = storySchema.safeParse(book.pages);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Le contenu du livre est corrompu." },
      { status: 500 },
    );
  }

  const pdf = await renderStoryPdf(parsed.data);
  const safeTitle = book.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "livre";

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
    },
  });
}
