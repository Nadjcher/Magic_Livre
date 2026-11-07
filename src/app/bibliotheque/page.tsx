/**
 * Bibliothèque : l'étagère des contes, avec couverture, enfant et statut.
 */

import type { Metadata } from "next";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { failStaleBooks } from "@/lib/bookMaintenance";
import DeleteBookButton from "@/components/DeleteBookButton";
import LivreCouverture from "@/components/LivreCouverture";
import BoutonDemo from "@/components/BoutonDemo";
import { livresDemo } from "@/lib/demo";
import { estAdmin } from "@/lib/rateLimit";
import { bookImageUrl, migrateBookImagesToBlob } from "@/lib/bookImages";
import { storySchema } from "@/lib/storySchema";
import { waitUntil } from "@vercel/functions";

export const metadata: Metadata = {
  title: "Ma bibliothèque",
  description: "Espace personnel Encore une histoire.",
  robots: { index: false, follow: false },
};


/**
 * Allège en arrière-plan quelques anciens livres dont les images sont encore
 * dans la base (déplacées vers Blob, ou recompressées). Sans effet visible.
 */
async function allegerAnciensLivres(userId: string): Promise<void> {
  try {
    const ids = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Book"
      WHERE "userId" = ${userId} AND "deletedAt" IS NULL
        AND pages->>'couvertureUrl' LIKE 'data:image/png%'
      LIMIT 2`;
    for (const { id } of ids) {
      const b = await prisma.book.findUnique({ where: { id }, select: { pages: true } });
      const parsed = storySchema.safeParse(b?.pages);
      if (parsed.success) await migrateBookImagesToBlob(id, parsed.data);
    }
  } catch {
    /* best-effort */
  }
}

export default async function BibliothequePage(props: { searchParams: Promise<{ enfant?: string }> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  // Libère les livres bloqués en génération avant d'afficher la liste.
  await failStaleBooks(user.id);
  waitUntil(allegerAnciensLivres(user.id));

  // On ne charge JAMAIS le contenu des livres ici (il peut peser des dizaines de
  // Mo) : seulement les infos d'affichage, et si une couverture existe.
  const books = await prisma.book.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      child: { select: { id: true, firstName: true } },
    },
  });
  // Administrateur : les livres de démonstration (vidéos) sont rangés à part.
  const admin = estAdmin(user.email);
  const demo = admin ? await livresDemo(user.id) : new Set<string>();
  const demos = books.filter((b) => demo.has(b.id));
  const mesLivres = books.filter((b) => !demo.has(b.id));
  // Filtre par enfant (les livres de Hugo, de Lina…) pour garder l'étagère courte.
  const enfants = Array.from(new Map(mesLivres.map((b) => [b.child.id, b.child.firstName])).entries());
  const filtre = enfants.some(([id]) => id === searchParams.enfant) ? searchParams.enfant : null;
  const visibles = filtre ? mesLivres.filter((b) => b.child.id === filtre) : mesLivres;
  const avecCouverture = new Set(
    (
      await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Book"
        WHERE "userId" = ${user.id} AND "deletedAt" IS NULL
          AND pages->>'couvertureUrl' IS NOT NULL`
    ).map((r) => r.id),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-serif italic text-or-fonce">Votre étagère</p>
          <h1 className="text-3xl sm:text-4xl">Ma bibliothèque</h1>
        </div>
        <Link href="/creer" className="btn-primaire">
          Nouveau livre
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="carte-relief flex flex-col items-center gap-3 py-12 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/feerique/shelf.webp"
            alt="Une étagère douillette qui attend ses contes"
            className="h-44 w-44 object-contain"
          />
          <h2 className="text-2xl">Une étagère qui rêve de son premier conte</h2>
          <p className="max-w-sm text-magique-texteClair">
            Ici viendront se ranger toutes les aventures dont votre enfant est le héros.
          </p>
          <Link href="/creer" className="btn-primaire">
            Créer notre première histoire
          </Link>
        </div>
      ) : (
        <>
          {enfants.length > 1 && (
            <nav className="sans-barre -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Filtrer par enfant">
              {[[null, `Tous (${mesLivres.length})`] as const, ...enfants.map(([id, prenom]) => [id, `${prenom} (${mesLivres.filter((b) => b.child.id === id).length})`] as const)].map(([id, label]) => (
                <Link
                  key={id ?? "tous"}
                  href={id ? `/bibliotheque?enfant=${id}` : "/bibliotheque"}
                  aria-current={filtre === id ? "page" : undefined}
                  className={`flex-none rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    filtre === id ? "border-magique-primaire bg-magique-primaire text-nuit" : "border-white/20 hover:border-white"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5">
            {visibles.map((book, i) => (
              <li key={book.id} className="group/livre anim-fade relative" style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}>
                <LivreCouverture
                  href={`/bibliotheque/${book.id}`}
                  titre={book.title}
                  enfant={filtre ? undefined : book.child.firstName}
                  couverture={avecCouverture.has(book.id) ? bookImageUrl(book.id, "cover", undefined, 480) : null}
                  statut={book.status}
                  priorite={i < 5}
                />
                <div className="absolute right-2 top-2 flex gap-1.5 sm:opacity-0 sm:transition sm:focus-within:opacity-100 sm:group-hover/livre:opacity-100">
                  {admin && <BoutonDemo bookId={book.id} estDemo={false} />}
                  <DeleteBookButton bookId={book.id} title={book.title} icone />
                </div>
              </li>
            ))}
          </ul>
          {demos.length > 0 && (
            <details className="rounded-2xl bg-white/[0.04] p-5">
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
                Livres de démonstration ({demos.length}) · visibles par vous seul
              </summary>
              <ul className="mt-5 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-6">
                {demos.map((book) => (
                  <li key={book.id} className="relative space-y-2">
                    <LivreCouverture
                      href={`/bibliotheque/${book.id}`}
                      titre={book.title}
                      enfant={book.child.firstName}
                      couverture={avecCouverture.has(book.id) ? bookImageUrl(book.id, "cover", undefined, 320) : null}
                      statut={book.status}
                    />
                    <BoutonDemo bookId={book.id} estDemo />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
