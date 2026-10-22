/**
 * Téléchargement du cahier de coloriage (version dessin au trait, à imprimer).
 * Réservé aux livres payés. Les dessins au trait sont générés à la demande.
 */

import { NextResponse } from "next/server";
import { getPaidBookStory, safeFileName } from "@/lib/bookAccess";
import { generateIllustration, illustrationsEnabled } from "@/lib/illustration";
import { resolveImages } from "@/lib/imageFetch";
import { renderColoringPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const acc = await getPaidBookStory(params.id);
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  if (!illustrationsEnabled()) {
    return NextResponse.json(
      { error: "Le cahier de coloriage nécessite l'activation des illustrations." },
      { status: 409 },
    );
  }

  const style = acc.story.style ?? "feerique";
  const urls = await Promise.all(
    acc.story.pages.map(async (p, i) => {
      const r = await generateIllustration({
        style,
        scene: p.scene_illustration,
        coloring: true,
        seed: 900_000 + i,
      });
      return r.imageUrl;
    }),
  );

  // Résout les dessins au trait en data URL avant le rendu (fiabilité).
  const resolved = await resolveImages(urls);
  const pdf = await renderColoringPdf(acc.story, resolved);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(acc.title)}-coloriage.pdf"`,
    },
  });
}
