/**
 * Téléchargement d'un poster A4 du héros (à imprimer pour la chambre).
 * Réservé aux livres payés.
 */

import { NextResponse } from "next/server";
import { getPaidBookStory, safeFileName } from "@/lib/bookAccess";
import { renderPosterPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const acc = await getPaidBookStory(params.id);
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  const pdf = await renderPosterPdf(acc.story, acc.childName);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(acc.title)}-poster.pdf"`,
    },
  });
}
