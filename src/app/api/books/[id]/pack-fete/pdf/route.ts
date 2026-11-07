/**
 * Produit deluxe « Pack Fête d'anniversaire » (A4, plusieurs planches).
 * Réservé aux acheteurs de ce produit (sku "pack_fete").
 */

import { NextResponse } from "next/server";
import { pdfResponse } from "@/lib/pdfResponse";
import { getPaidProductStory, safeFileName } from "@/lib/bookAccess";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { renderPartyPackPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }): Promise<Response> {
  const params = await props.params;
  const acc = await getPaidProductStory(params.id, "pack_fete");
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  return pdfResponse(`${safeFileName(acc.title)}-pack-fete.pdf`, async (q) => {
    const image =
      (await fetchAsDataUrl(acc.story.couvertureUrl, q)) ??
      (await fetchAsDataUrl(acc.story.pages[0]?.imageUrl, q));
    return renderPartyPackPdf(acc.story, acc.childName, image);
  });
}
