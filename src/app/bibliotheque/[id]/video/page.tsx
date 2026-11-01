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
import TrailerMaker from "@/components/TrailerMaker";
import { ESSAIS_MAX } from "@/lib/trailer";
import DeluxeShop from "@/components/DeluxeShop";

export const dynamic = "force-dynamic";
// Lancement de la bande-annonce (écriture + envoi des animations) en arrière-plan.
export const maxDuration = 300;

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
        <h1 className="mt-1 text-3xl sm:text-4xl">🎬 La bande-annonce</h1>
        <p className="text-magique-texteClair">
          « {book.title} » comme un vrai dessin animé : les personnages bougent, une voix raconte, en musique.
        </p>
      </div>

      {paye ? (
        <TrailerMaker
          bookId={book.id}
          titre={story.titre}
          sousTitre={`Une histoire pour ${book.child.firstName}`}
          couverture={story.couvertureUrl ?? null}
          initial={parsed.data.video ?? null}
          essaisMax={ESSAIS_MAX}
          nomFichier={`${safeFileName(book.title)}-bande-annonce`}
        />
      ) : (
        <>
          <p className="text-sm text-magique-texteClair">
            Débloquez la bande-annonce pour {formatEuros(produit.priceCents)} (ou incluse dans la formule
            Tout compris).
          </p>
          <DeluxeShop bookId={book.id} produits={[produit]} skusPayes={[]} />
        </>
      )}
    </div>
  );
}
