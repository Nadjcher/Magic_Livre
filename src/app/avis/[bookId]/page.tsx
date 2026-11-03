/** Donner son avis sur un livre acheté (lien de l'email ou de la boutique). */

import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { lightenStory } from "@/lib/bookImages";
import { storySchema } from "@/lib/storySchema";
import { aAchete, avisDuLivre } from "@/lib/reviews";
import ReviewForm from "@/components/ReviewForm";
import Notice from "@/components/Notice";

export const metadata: Metadata = { title: "Donner mon avis", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DonnerAvisPage({ params }: { params: { bookId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suite=/avis/${params.bookId}`);
  const book = await prisma.book.findFirst({
    where: { id: params.bookId, userId: user.id, deletedAt: null },
    select: { id: true, title: true, pages: true, child: { select: { age: true } } },
  });
  if (!book) notFound();
  const achete = await aAchete(user.id, book.id);
  const deja = achete ? await avisDuLivre(user.id, book.id) : null;
  const parsed = storySchema.safeParse(book.pages);
  const cover = parsed.success ? lightenStory(parsed.data, book.id).couvertureUrl : null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-20 w-28 flex-none rounded-xl object-cover" />
        )}
        <div>
          <p className="text-sm text-magique-texteClair">Votre avis sur</p>
          <h1 className="text-2xl sm:text-3xl">{book.title}</h1>
        </div>
      </div>
      {!achete ? (
        <Notice kind="info">
          Les avis sont réservés aux livres achetés. <Link href={`/bibliotheque/${book.id}/boutique`} className="underline">Voir la boutique du livre</Link>
        </Notice>
      ) : (
        <div className="carte">
          {deja && <p className="mb-4 text-sm text-magique-texteClair">Vous avez déjà donné votre avis ; vous pouvez le modifier.</p>}
          <ReviewForm bookId={book.id} age={book.child.age} initial={deja ? { note: deja.note, texte: deja.texte } : undefined} />
        </div>
      )}
    </div>
  );
}
