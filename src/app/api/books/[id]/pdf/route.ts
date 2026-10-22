/**
 * Téléchargement du PDF couleur d'un livre.
 *
 * Autorisé UNIQUEMENT si : l'utilisateur est connecté, le livre lui appartient,
 * il est « ready », et une commande « paid » existe (paiement validé par le
 * webhook Stripe signé). Aucun filigrane. Les images sont résolues côté serveur
 * avant le rendu pour qu'une image lente ou absente ne fasse jamais échouer le PDF.
 */

import { NextResponse } from "next/server";
import { getPaidBookStory, safeFileName } from "@/lib/bookAccess";
import { resolveImages } from "@/lib/imageFetch";
import { renderStoryPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const acc = await getPaidBookStory(params.id);
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  // Résout couverture + images de pages en data URL (délai + taille bornés).
  const [cover, ...pageImages] = await resolveImages([
    acc.story.couvertureUrl,
    ...acc.story.pages.map((p) => p.imageUrl),
  ]);
  const story = {
    ...acc.story,
    couvertureUrl: cover,
    pages: acc.story.pages.map((p, i) => ({ ...p, imageUrl: pageImages[i] ?? null })),
  };

  const pdf = await renderStoryPdf(story);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(acc.title)}.pdf"`,
    },
  });
}
