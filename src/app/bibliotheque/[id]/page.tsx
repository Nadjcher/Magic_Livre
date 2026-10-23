/**
 * Page d'un livre : lecteur page par page, achat et téléchargement du PDF.
 */

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { storySchema } from "@/lib/storySchema";
import BookReader from "@/components/BookReader";
import PurchaseDownload from "@/components/PurchaseDownload";
import BookExtras from "@/components/BookExtras";
import DeleteBookButton from "@/components/DeleteBookButton";
import Notice from "@/components/Notice";

function formatPrix(cents: number): string {
  const euros = (cents / 100).toFixed(2).replace(".", ",");
  return `${euros} €`;
}

export default async function LivrePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { paiement?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const book = await prisma.book.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null },
    include: { child: { select: { firstName: true } } },
  });
  if (!book) notFound();

  const paidOrder = await prisma.order.findFirst({
    where: { bookId: book.id, userId: user.id, status: "paid" },
  });
  const paid = Boolean(paidOrder);

  const premium = book.tier === "premium";
  const prix = formatPrix(premium ? env.bookPricePremiumCents() : env.bookPriceCents());

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
        <Notice kind="info">
          L'histoire est en cours de génération. Rafraîchissez la page dans un
          instant.
        </Notice>
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
              <div className="carte">
                <h2 className="font-semibold">Version imprimable (PDF)</h2>
                <p className="mb-3 mt-1 text-sm text-magique-texteClair">
                  {paid
                    ? "Votre paiement est validé. Téléchargez votre livre au format A4 paysage."
                    : premium
                      ? "Édition premium : PDF A4 paysage, illustrations haut de gamme, sans filigrane."
                      : "Obtenez le PDF A4 paysage, sans filigrane, prêt à imprimer."}
                </p>
                <PurchaseDownload bookId={book.id} paid={paid} prix={prix} />
              </div>
              {paid && <BookExtras bookId={book.id} />}
            </>
          );
        })()
      ) : null}
    </div>
  );
}
