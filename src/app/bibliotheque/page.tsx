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
import { bookImageUrl, migrateBookImagesToBlob } from "@/lib/bookImages";
import { storySchema } from "@/lib/storySchema";
import { waitUntil } from "@vercel/functions";

export const metadata: Metadata = {
  title: "Ma bibliothèque",
  description: "Espace personnel Storilou.",
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

const STATUT: Record<string, { label: string; classe: string }> = {
  draft: { label: "Brouillon", classe: "bg-white/10 text-magique-texteClair" },
  generating: { label: "En cours…", classe: "bg-or/15 text-or-fonce" },
  ready: { label: "Prêt à lire", classe: "bg-magique-accent/15 text-emerald-200" },
  failed: { label: "Échec", classe: "bg-magique-rose/15 text-rose-200" },
};

export default async function BibliothequePage() {
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
      child: { select: { firstName: true } },
    },
  });
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
          <h2 className="text-2xl">Votre étagère est encore vide</h2>
          <p className="max-w-sm text-magique-texteClair">
            Le premier conte de votre enfant n'attend que vous.
          </p>
          <Link href="/creer" className="btn-primaire">
            Créer notre première histoire
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {books.map((book, i) => {
            const st = STATUT[book.status] ?? {
              label: book.status,
              classe: "bg-white/10 text-magique-texteClair",
            };
            const thumb = avecCouverture.has(book.id) ? bookImageUrl(book.id, "cover") : null;
            return (
              <li
                key={book.id}
                data-tilt
                className="carte anim-fade flex gap-4"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Couverture ou médaillon */}
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-24 w-20 flex-none rounded-xl object-cover shadow-sm"
                  />
                ) : (
                  <div
                    className="flex h-24 w-20 flex-none items-center justify-center rounded-xl font-serif text-3xl text-white shadow-sm"
                    style={{ backgroundImage: "linear-gradient(160deg,#5b9bff,#4f5fe0)" }}
                    aria-hidden="true"
                  >
                    {book.title.trim().charAt(0).toUpperCase() || "✦"}
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/bibliotheque/${book.id}`}
                    className="font-serif text-lg leading-snug text-magique-primaire hover:underline"
                  >
                    {book.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-magique-texteClair">
                    Pour {book.child.firstName}
                  </p>
                  <span
                    className={`mt-2 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${st.classe}`}
                  >
                    {st.label}
                  </span>
                  <div className="mt-auto pt-3">
                    <DeleteBookButton bookId={book.id} title={book.title} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
