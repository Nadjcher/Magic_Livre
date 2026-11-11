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

import { estAdmin } from "@/lib/rateLimit";
import { EN_RELECTURE_IMAGES } from "@/lib/illustrationStatus";

export const runtime = "nodejs";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }): Promise<Response> {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Non connecté.", { status: 401 });

  // L'administrateur voit les illustrations d'un livre en relecture d'images (atelier), rien d'autre.
  const admin = estAdmin(user.email);
  const which = new URL(req.url).searchParams.get("i") ?? "";
  let rows: { url: string | null }[];
  if (which === "cover") {
    rows = await prisma.$queryRaw<{ url: string | null }[]>`
      SELECT pages->>'couvertureUrl' AS url FROM "Book"
      WHERE id = ${params.id} AND ("userId" = ${user.id} OR (${admin} AND "errorMessage" = ${EN_RELECTURE_IMAGES})) AND "deletedAt" IS NULL`;
  } else {
    const index = Number.parseInt(which, 10);
    if (!Number.isInteger(index) || index < 0 || index > 50) {
      return new NextResponse("Image inconnue.", { status: 400 });
    }
    rows = await prisma.$queryRaw<{ url: string | null }[]>`
      SELECT pages->'pages'->(${index}::int)->>'imageUrl' AS url FROM "Book"
      WHERE id = ${params.id} AND ("userId" = ${user.id} OR (${admin} AND "errorMessage" = ${EN_RELECTURE_IMAGES})) AND "deletedAt" IS NULL`;
  }

  const url = rows[0]?.url;
  if (!url) return new NextResponse("Image introuvable.", { status: 404 });

  // Vignette demandée (?w=480) : on réduit l'image côté serveur. Une couverture
  // pleine taille (faite pour l'impression) pèse ~10× plus qu'une vignette.
  const w = Number(new URL(req.url).searchParams.get("w"));
  const largeur = [320, 480, 640, 960].includes(w) ? w : 0;

  // Image déjà stockée ailleurs (Vercel Blob public, fal) : redirection, sauf vignette.
  if (/^https?:\/\//.test(url) && !largeur) return NextResponse.redirect(url, 302);

  let bytes: Buffer;
  let mime = "image/jpeg";
  if (/^https?:\/\//.test(url)) {
    const r = await fetch(url, { signal: AbortSignal.timeout(20_000) }).catch(() => null);
    if (!r?.ok) return NextResponse.redirect(url, 302);
    bytes = Buffer.from(await r.arrayBuffer());
    mime = r.headers.get("content-type") ?? mime;
  } else if (isPrivateBlobRef(url)) {
    // Store Blob privé : le serveur lit le fichier et le sert au propriétaire.
    const r = await readPrivateBlob(url);
    if (!r) return new NextResponse("Image introuvable.", { status: 404 });
    bytes = r.bytes;
    mime = r.mime;
  } else {
    const m = /^data:([^;]+);base64,(.+)$/.exec(url);
    if (!m) return new NextResponse("Image illisible.", { status: 404 });
    bytes = Buffer.from(m[2] as string, "base64");
    mime = m[1] as string;
  }

  if (largeur) {
    try {
      const sharp = (await import("sharp")).default;
      bytes = await sharp(bytes!).resize({ width: largeur, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      mime = "image/webp";
    } catch {
      /* image servie telle quelle */
    }
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": mime,
      // Image propre à un utilisateur : cache navigateur uniquement.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
