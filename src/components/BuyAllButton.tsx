"use client";

/** Bouton d'achat de la formule « Tout compris ». */

import { useState, useTransition } from "react";
import { startCheckout } from "@/app/actions/checkout";
import { PACK_TOUT } from "@/lib/products";
import CaseConsentement from "./CaseConsentement";

export default function BuyAllButton({ bookId }: { bookId: string }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [accord, setAccord] = useState(false);
  return (
    <div className="mt-2 max-w-xs space-y-2 text-left">
      <CaseConsentement coche={accord} onChange={setAccord} />
      <button
        type="button"
        className="btn-primaire"
        disabled={pending || !accord}
        onClick={() =>
          start(async () => {
            setErreur(null);
            const r = await startCheckout(bookId, PACK_TOUT.sku, true);
            if (r.ok && r.url) window.location.href = r.url;
            else setErreur(r.message);
          })
        }
      >
        {pending ? "Redirection…" : "Tout prendre"}
      </button>
      {erreur && <p className="mt-2 max-w-[16rem] text-sm text-red-300">{erreur}</p>}
    </div>
  );
}
