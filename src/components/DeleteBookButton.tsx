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
}: {
  bookId: string;
  title: string;
  redirectAfter?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
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
      Supprimer
    </button>
  );
}
