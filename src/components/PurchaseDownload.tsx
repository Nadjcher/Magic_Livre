"use client";

/**
 * Bouton d'achat / téléchargement du PDF.
 * - Si le livre n'est pas payé : lance Stripe Checkout.
 * - Si le livre est payé : propose le téléchargement du PDF (sans filigrane).
 */

import { useState, useTransition } from "react";
import { startCheckout } from "@/app/actions/checkout";
import Notice from "./Notice";

export default function PurchaseDownload({
  bookId,
  paid,
  prix,
}: {
  bookId: string;
  paid: boolean;
  prix: string;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (paid) {
    return (
      <a href={`/api/books/${bookId}/pdf`} className="btn-primaire">
        📄 Télécharger le PDF
      </a>
    );
  }

  return (
    <div className="space-y-3">
      <button
        className="btn-primaire"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setErreur(null);
            const res = await startCheckout(bookId);
            if (res.ok && res.url) {
              window.location.href = res.url;
            } else {
              setErreur(res.message);
            }
          })
        }
      >
        {pending ? "Redirection vers le paiement…" : `Télécharger le PDF (${prix})`}
      </button>
      {erreur && <Notice kind="erreur">{erreur}</Notice>}
    </div>
  );
}
