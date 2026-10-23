/**
 * Planche d'autocollants à découper (vignettes des illustrations, A4).
 * Réservé aux livres payés.
 */

import { NextResponse } from "next/server";
import { getPaidBookStory, safeFileName } from "@/lib/bookAccess";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { renderStickersPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const acc = await getPaidBookStory(params.id);
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  const urls = [acc.story.couvertureUrl, ...acc.story.pages.map((p) => p.imageUrl)];
  const resolved = await Promise.all(urls.map((u) => fetchAsDataUrl(u)));
  const images = resolved.filter((u): u is string => Boolean(u));

  const pdf = await renderStickersPdf(acc.story, images);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(acc.title)}-autocollants.pdf"`,
    },
  });
}
