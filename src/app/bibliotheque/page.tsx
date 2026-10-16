/**
 * Bibliothèque : liste des livres avec titre, enfant et statut.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DeleteBookButton from "@/components/DeleteBookButton";

const STATUT_LABEL: Record<string, string> = {
  draft: "Brouillon",
  generating: "Génération en cours…",
  ready: "Prêt",
  failed: "Échec",
};

export default async function BibliothequePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const books = await prisma.book.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { child: { select: { firstName: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-magique-primaire">Ma bibliothèque</h1>
        <Link href="/creer" className="btn-primaire">
          + Nouveau livre
        </Link>
      </div>

      {books.length === 0 ? (
        <p className="text-magique-texteClair">
          Vous n'avez pas encore de livre.{" "}
          <Link href="/creer" className="underline">
            Créez-en un !
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {books.map((book) => (
            <li key={book.id} className="carte flex items-center justify-between gap-4">
              <div>
                <Link
                  href={`/bibliotheque/${book.id}`}
                  className="font-semibold text-magique-primaire hover:underline"
                >
                  {book.title}
                </Link>
                <p className="text-sm text-magique-texteClair">
                  Pour {book.child.firstName} — {STATUT_LABEL[book.status] ?? book.status}
                </p>
              </div>
              <DeleteBookButton bookId={book.id} title={book.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
