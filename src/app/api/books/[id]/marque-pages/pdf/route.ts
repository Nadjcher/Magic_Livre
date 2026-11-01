/**
 * Marque-pages à découper (A4 paysage, trois bandes).
 * Réservé aux livres payés.
 */

import { NextResponse } from "next/server";
import { pdfResponse } from "@/lib/pdfResponse";
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

  return pdfResponse(`${safeFileName(acc.title)}-marque-pages.pdf`, async (q) => {
    const image =
      (await fetchAsDataUrl(acc.story.couvertureUrl, q)) ??
      (await fetchAsDataUrl(acc.story.pages[0]?.imageUrl, q));
    return renderBookmarkPdf(acc.story, acc.childName, image);
  });
}
