/**
 * Produit deluxe « Pack Fête d'anniversaire » (A4, plusieurs planches).
 * Réservé aux acheteurs de ce produit (sku "pack_fete").
 */

import { NextResponse } from "next/server";
import { getPaidProductStory, safeFileName } from "@/lib/bookAccess";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { renderPartyPackPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const acc = await getPaidProductStory(params.id, "pack_fete");
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  const image =
    (await fetchAsDataUrl(acc.story.couvertureUrl)) ??
    (await fetchAsDataUrl(acc.story.pages[0]?.imageUrl));

  const pdf = await renderPartyPackPdf(acc.story, acc.childName, image);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(acc.title)}-pack-fete.pdf"`,
    },
  });
}
