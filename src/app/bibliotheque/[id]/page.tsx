/**
 * Page d'un livre : lecteur page par page, achat et téléchargement du PDF.
 */

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { failStaleBooks } from "@/lib/bookMaintenance";
import { storySchema } from "@/lib/storySchema";
import BookReader from "@/components/BookReader";
import DeleteBookButton from "@/components/DeleteBookButton";
import AutoRefresh from "@/components/AutoRefresh";
import Notice from "@/components/Notice";

export default async function LivrePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { paiement?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  // Libère ce livre s'il est resté bloqué en génération trop longtemps.
  await failStaleBooks(user.id);

  const book = await prisma.book.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null },
    include: { child: { select: { firstName: true } } },
  });
  if (!book) notFound();

  const premium = book.tier === "premium";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/bibliotheque" className="text-sm text-magique-texteClair hover:underline">
            ← Ma bibliothèque
          </Link>
          <h1 className="mt-1 text-3xl sm:text-4xl">{book.title}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-magique-texteClair">
            Pour {book.child.firstName}
            {premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-magique-primaire/10 px-2.5 py-0.5 text-xs font-semibold text-magique-primaire">
                ✦ Édition premium
              </span>
            )}
          </p>
        </div>
        <DeleteBookButton bookId={book.id} title={book.title} redirectAfter="/bibliotheque" />
      </div>

      {searchParams.paiement === "succes" && (
        <Notice kind="succes">
          Merci ! Votre paiement est en cours de validation. Le téléchargement
          sera disponible dès la confirmation.
        </Notice>
      )}
      {searchParams.paiement === "annule" && (
        <Notice kind="info">Paiement annulé. Vous pouvez réessayer quand vous voulez.</Notice>
      )}

      {book.status === "generating" && (
        <>
          <AutoRefresh seconds={5} />
          <Notice kind="info">
            L'histoire et les illustrations sont en cours de création… Cette page
            se met à jour toute seule, patientez un instant.
          </Notice>
        </>
      )}

      {book.status === "failed" && (
        <Notice kind="erreur">
          {book.errorMessage ??
            "La génération a échoué. Vous pouvez supprimer ce livre et réessayer."}
        </Notice>
      )}

      {book.status === "ready" && book.pages ? (
        (() => {
          const parsed = storySchema.safeParse(book.pages);
          if (!parsed.success) {
            return (
              <Notice kind="erreur">
                Le contenu de ce livre est illisible. Merci de le supprimer et d'en
                créer un nouveau.
              </Notice>
            );
          }
          return (
            <>
              <BookReader story={parsed.data} />
              <div className="carte flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-xl">🎁 La boutique de ce livre</h2>
                  <p className="mt-1 text-sm text-magique-texteClair">
                    Le livre à imprimer, le kit inclus (coloriage, affiche, invitation,
                    autocollants, marque-pages, audio) et des cadeaux deluxe — tous créés à
                    partir de cette histoire.
                  </p>
                </div>
                <Link
                  href={`/bibliotheque/${book.id}/boutique`}
                  className="btn-primaire flex-none"
                >
                  Voir la boutique →
                </Link>
              </div>
            </>
          );
        })()
      ) : null}
    </div>
  );
}
