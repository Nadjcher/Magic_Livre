/**
 * Vidéo souvenir d'un livre : réservée aux acheteurs du produit « video » (ou
 * de la formule Tout compris). La vidéo est fabriquée dans le navigateur.
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { lightenStory } from "@/lib/bookImages";
import { getDeluxeProduct, skusDonnantAcces, formatEuros } from "@/lib/products";
import { safeFileName } from "@/lib/bookAccess";
import VideoMaker from "@/components/VideoMaker";
import DeluxeShop from "@/components/DeluxeShop";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suite=/bibliotheque/${params.id}/video`);

  const book = await prisma.book.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null, status: "ready" },
    include: { child: { select: { firstName: true } } },
  });
  if (!book) notFound();
  const parsed = storySchema.safeParse(book.pages);
  if (!parsed.success) notFound();

  const paye = await prisma.order.findFirst({
    where: { bookId: book.id, userId: user.id, status: "paid", sku: { in: skusDonnantAcces("video") } },
    select: { id: true },
  });
  const produit = getDeluxeProduct("video")!;
  const story = lightenStory(parsed.data, book.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href={`/bibliotheque/${book.id}/boutique`} className="text-sm text-magique-texteClair hover:underline">
          ← La boutique de ce livre
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">🎬 La vidéo souvenir</h1>
        <p className="text-magique-texteClair">
          « {book.title} » en vidéo : les illustrations s'animent, le texte défile en musique.
        </p>
      </div>

      {paye ? (
        <VideoMaker
          titre={story.titre}
          sousTitre={`Une histoire pour ${book.child.firstName}`}
          couverture={story.couvertureUrl ?? null}
          pages={story.pages.map((p) => ({ texte: p.texte, image: p.imageUrl ?? null }))}
          nomFichier={`${safeFileName(book.title)}-video`}
        />
      ) : (
        <>
          <p className="text-sm text-magique-texteClair">
            Débloquez la vidéo pour {formatEuros(produit.priceCents)} (ou incluse dans la formule
            Tout compris).
          </p>
          <DeluxeShop bookId={book.id} produits={[produit]} skusPayes={[]} />
        </>
      )}
    </div>
  );
}
