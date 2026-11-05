"use client";

/**
 * Bouton de suppression d'un livre, avec confirmation.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBook } from "@/app/actions/books";

export default function DeleteBookButton({
  bookId,
  title,
  redirectAfter,
  icone = false,
}: {
  bookId: string;
  title: string;
  redirectAfter?: string;
  /** petite pastille ronde (posée sur une couverture) au lieu du lien texte */
  icone?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      className={
        icone
          ? "flex h-8 w-8 items-center justify-center rounded-full bg-[#0b1236]/70 text-white/90 backdrop-blur transition hover:bg-red-500/90 disabled:opacity-50"
          : "text-sm text-red-300 hover:underline disabled:opacity-50"
      }
      aria-label={icone ? `Supprimer « ${title} »` : undefined}
      title={icone ? "Supprimer" : undefined}
      disabled={pending}
      onClick={() => {
        if (!confirm(`Supprimer définitivement « ${title} » ?`)) return;
        startTransition(async () => {
          const res = await deleteBook(bookId);
          if (res.ok) {
            if (redirectAfter) router.push(redirectAfter);
            else router.refresh();
          } else {
            alert(res.message);
          }
        });
      }}
    >
      {icone ? (
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </svg>
      ) : (
        "Supprimer"
      )}
    </button>
  );
}
