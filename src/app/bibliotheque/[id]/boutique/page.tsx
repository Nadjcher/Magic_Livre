/**
 * Boutique dédiée d'un livre : l'édition du livre, le kit inclus et les
 * produits deluxe à l'unité — tous créés à partir de CETTE histoire.
 */

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { storySchema } from "@/lib/storySchema";
import { DELUXE_PRODUCTS, formatEuros } from "@/lib/products";
import { confirmPaidSession } from "@/lib/stripe";
import PurchaseDownload from "@/components/PurchaseDownload";
import BookExtras from "@/components/BookExtras";
import DeluxeShop from "@/components/DeluxeShop";
import Notice from "@/components/Notice";

const KIT = [
  { emoji: "🖍️", nom: "Cahier de coloriage" },
  { emoji: "🖼️", nom: "Affiche du héros" },
  { emoji: "🎉", nom: "Carte d'invitation" },
  { emoji: "⭐", nom: "Planche d'autocollants" },
  { emoji: "🔖", nom: "Marque-pages" },
  { emoji: "🎧", nom: "Histoire audio (MP3)" },
];

export default async function BoutiquePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { paiement?: string; session_id?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const book = await prisma.book.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null },
    include: { child: { select: { firstName: true } } },
  });
  if (!book || book.status !== "ready" || !book.pages) notFound();

  // Filet de sécurité : si on revient d'un paiement, on confirme directement
  // auprès de Stripe (indépendant du webhook) pour débloquer le téléchargement.
  if (searchParams.session_id) {
    await confirmPaidSession(searchParams.session_id, user.id, book.id);
  }

  const parsed = storySchema.safeParse(book.pages);
  const cover = parsed.success ? parsed.data.couvertureUrl ?? null : null;

  const paidOrders = await prisma.order.findMany({
    where: { bookId: book.id, userId: user.id, status: "paid" },
    select: { sku: true },
  });
  const skusPayes = paidOrders.map((o) => o.sku);
  const paid = skusPayes.includes("book");

  const premium = book.tier === "premium";
  const prix = formatEuros(premium ? env.bookPricePremiumCents() : env.bookPriceCents());

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/bibliotheque/${book.id}`} className="text-sm text-magique-texteClair hover:underline">
          ← Retour au livre
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">La boutique de ce livre 🎁</h1>
        <p className="text-magique-texteClair">
          Tous les cadeaux ci-dessous sont créés à partir de l'histoire de {book.child.firstName}.
        </p>
      </div>

      {searchParams.paiement === "succes" && (
        <Notice kind="succes">
          Merci ! Votre paiement est en cours de validation. Vos téléchargements apparaissent
          ici dès la confirmation (rafraîchissez dans un instant).
        </Notice>
      )}
      {searchParams.paiement === "annule" && (
        <Notice kind="info">Paiement annulé. Vous pouvez réessayer quand vous voulez.</Notice>
      )}

      {/* En-tête visuel : couverture + édition du livre */}
      <section className="carte grid gap-6 sm:grid-cols-[200px_1fr] sm:items-center">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="w-full rounded-2xl" />
        ) : (
          <div className="aspect-[4/3] w-full rounded-2xl bg-magique-primaire/10" />
        )}
        <div>
          <h2 className="font-serif text-2xl">{book.title}</h2>
          <p className="mt-1 text-sm text-magique-texteClair">
            {premium ? "Édition premium" : "Édition standard"} · le livre PDF à imprimer,
            {" "}
            <strong>avec tout le kit inclus</strong>.
          </p>
          <div className="mt-4">
            <PurchaseDownload bookId={book.id} paid={paid} prix={prix} />
          </div>
        </div>
      </section>

      {/* Kit inclus avec le livre */}
      {paid ? (
        <BookExtras bookId={book.id} />
      ) : (
        <div className="carte">
          <h2 className="font-serif text-xl">Inclus avec le livre ✨</h2>
          <p className="mb-4 mt-1 text-sm text-magique-texteClair">
            Débloqué automatiquement dès l'achat du livre — à imprimer et offrir.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KIT.map((k) => (
              <div
                key={k.nom}
                className="flex items-center gap-3 rounded-2xl border border-magique-trait bg-white/60 p-4 opacity-80"
              >
                <span className="text-2xl" aria-hidden="true">{k.emoji}</span>
                <span className="font-semibold text-magique-texte">{k.nom}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produits deluxe à l'unité */}
      <DeluxeShop bookId={book.id} produits={DELUXE_PRODUCTS} skusPayes={skusPayes} />
    </div>
  );
}
