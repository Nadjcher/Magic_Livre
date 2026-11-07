/**
 * Carte d'invitation d'anniversaire sur le thème du livre (A4).
 * Réservé aux livres payés.
 */

import { NextResponse } from "next/server";
import { pdfResponse } from "@/lib/pdfResponse";
import { getPaidBookStory, safeFileName } from "@/lib/bookAccess";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { renderInvitationPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }): Promise<Response> {
  const params = await props.params;
  const acc = await getPaidBookStory(params.id);
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  return pdfResponse(`${safeFileName(acc.title)}-invitation.pdf`, async (q) => {
    const image =
      (await fetchAsDataUrl(acc.story.couvertureUrl, q)) ??
      (await fetchAsDataUrl(acc.story.pages[0]?.imageUrl, q));
    return renderInvitationPdf(acc.story, acc.childName, image);
  });
}
