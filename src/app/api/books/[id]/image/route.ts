/**
 * Sert UNE illustration d'un livre (couverture ou page), réservée à son
 * propriétaire. Extrait l'image directement en SQL pour ne pas charger tout le
 * livre (qui peut peser des dizaines de Mo quand les images sont embarquées).
 *
 *   /api/books/{id}/image?i=cover   → couverture
 *   /api/books/{id}/image?i=3       → illustration de la page d'index 3
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isPrivateBlobRef, readPrivateBlob } from "@/lib/blobStore";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Non connecté.", { status: 401 });

  const which = new URL(req.url).searchParams.get("i") ?? "";
  let rows: { url: string | null }[];
  if (which === "cover") {
    rows = await prisma.$queryRaw<{ url: string | null }[]>`
      SELECT pages->>'couvertureUrl' AS url FROM "Book"
      WHERE id = ${params.id} AND "userId" = ${user.id} AND "deletedAt" IS NULL`;
  } else {
    const index = Number.parseInt(which, 10);
    if (!Number.isInteger(index) || index < 0 || index > 50) {
      return new NextResponse("Image inconnue.", { status: 400 });
    }
    rows = await prisma.$queryRaw<{ url: string | null }[]>`
      SELECT pages->'pages'->(${index}::int)->>'imageUrl' AS url FROM "Book"
      WHERE id = ${params.id} AND "userId" = ${user.id} AND "deletedAt" IS NULL`;
  }

  const url = rows[0]?.url;
  if (!url) return new NextResponse("Image introuvable.", { status: 404 });

  // Image déjà stockée ailleurs (Vercel Blob public) : simple redirection.
  if (/^https?:\/\//.test(url)) return NextResponse.redirect(url, 302);

  // Store Blob privé : le serveur lit le fichier et le sert au propriétaire.
  if (isPrivateBlobRef(url)) {
    const r = await readPrivateBlob(url);
    if (!r) return new NextResponse("Image introuvable.", { status: 404 });
    return new NextResponse(new Uint8Array(r.bytes), {
      status: 200,
      headers: {
        "Content-Type": r.mime,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  }

  const m = /^data:([^;]+);base64,(.+)$/.exec(url);
  if (!m) return new NextResponse("Image illisible.", { status: 404 });
  return new NextResponse(new Uint8Array(Buffer.from(m[2] as string, "base64")), {
    status: 200,
    headers: {
      "Content-Type": m[1] as string,
      // Image propre à un utilisateur : cache navigateur uniquement.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
