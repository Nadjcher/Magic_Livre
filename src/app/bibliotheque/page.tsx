/**
 * Bibliothèque : l'étagère des contes, avec couverture, enfant et statut.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DeleteBookButton from "@/components/DeleteBookButton";

const STATUT: Record<string, { label: string; classe: string }> = {
  draft: { label: "Brouillon", classe: "bg-black/5 text-magique-texteClair" },
  generating: { label: "En cours…", classe: "bg-or/15 text-or-fonce" },
  ready: { label: "Prêt à lire", classe: "bg-magique-accent/15 text-emerald-800" },
  failed: { label: "Échec", classe: "bg-magique-rose/15 text-rose-700" },
};

/** Récupère l'URL de couverture stockée dans les pages JSON, si présente. */
function couverture(pages: unknown): string | null {
  if (pages && typeof pages === "object" && "couvertureUrl" in pages) {
    const url = (pages as { couvertureUrl?: unknown }).couvertureUrl;
    return typeof url === "string" ? url : null;
  }
  return null;
}

export default async function BibliothequePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const books = await prisma.book.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { child: { select: { firstName: true } } },
  });

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
        <div className="carte flex flex-col items-center gap-4 py-14 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#e9a94b" aria-hidden="true">
            <path d="M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z" />
          </svg>
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
              classe: "bg-black/5 text-magique-texteClair",
            };
            const thumb = couverture(book.pages);
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
                    style={{ backgroundImage: "linear-gradient(160deg,#8b5cf6,#6d28d9)" }}
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
