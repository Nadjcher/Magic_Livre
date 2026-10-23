/**
 * Marque-pages à découper (A4 paysage, trois bandes).
 * Réservé aux livres payés.
 */

import { NextResponse } from "next/server";
import { getPaidBookStory, safeFileName } from "@/lib/bookAccess";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { renderBookmarkPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const acc = await getPaidBookStory(params.id);
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  const image =
    (await fetchAsDataUrl(acc.story.couvertureUrl)) ??
    (await fetchAsDataUrl(acc.story.pages[0]?.imageUrl));

  const pdf = await renderBookmarkPdf(acc.story, acc.childName, image);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(acc.title)}-marque-pages.pdf"`,
    },
  });
}
