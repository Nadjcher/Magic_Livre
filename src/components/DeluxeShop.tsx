"use client";

/**
 * Boutique des produits deluxe vendus à l'unité. Pour chaque produit :
 * - déjà acheté → bouton de téléchargement ;
 * - sinon → bouton d'achat qui lance Stripe Checkout.
 */

import Picto from "@/components/Picto";
import { useState, useTransition } from "react";
import { startCheckout } from "@/app/actions/checkout";
import { formatEuros, type DeluxeProduct } from "@/lib/products";
import Notice from "./Notice";
import CaseConsentement from "./CaseConsentement";


/** Petit dessin associé à chaque produit. */
const PICTO_SKU: Record<string, string> = { pack_fete: "fete", affiche_a3: "affiche", video: "video", tout: "tout", imprime: "imprime" };

export default function DeluxeShop({
  bookId,
  produits,
  skusPayes,
  titre = "Produits deluxe, à l'unité ✦",
}: {
  bookId: string;
  produits: DeluxeProduct[];
  skusPayes: string[];
  titre?: string;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [encours, setEncours] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [accord, setAccord] = useState(false);

  function acheter(sku: string) {
    startTransition(async () => {
      setErreur(null);
      setEncours(sku);
      const res = await startCheckout(bookId, sku, true);
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        setErreur(res.message);
        setEncours(null);
      }
    });
  }

  return (
    <div className="carte">
      <h2 className="font-serif text-xl">{titre}</h2>
      <p className="mb-4 mt-1 text-sm text-magique-texteClair">
        {produits.some((p) => p.physique)
          ? "Imprimé et expédié par notre imprimeur partenaire, livraison incluse."
          : "Des créations supplémentaires, à acheter séparément quand vous voulez."}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {produits.map((p) => {
          const paye = skusPayes.includes(p.sku);
          return (
            <div
              key={p.sku}
              className="flex items-start gap-3 rounded-2xl border border-magique-trait bg-white/[0.06] p-4"
            >
              <Picto cle={`offres/${PICTO_SKU[p.sku] ?? p.sku}`} secours={p.emoji} taille={48} />
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-magique-texte">{p.label}</span>
                  <span className="font-serif text-magique-primaire">{formatEuros(p.priceCents)}</span>
                </div>
                <p className="mt-0.5 text-sm text-magique-texteClair">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.physique ? (
                    <>
                      <button onClick={() => acheter(p.sku)} disabled={pending || !accord} className="btn-primaire px-4 py-2 text-sm">
                        {encours === p.sku ? "Redirection…" : `${paye ? "Commander un autre exemplaire" : "Commander"} (${formatEuros(p.priceCents)})`}
                      </button>
                      <a href={`/api/books/${bookId}/apercu-impression`} target="_blank" rel="noopener" className="btn-secondaire px-4 py-2 text-sm">
                        Voir l'aperçu avant impression
                      </a>
                      {paye && (
                        <a href="/compte" className="self-center text-sm underline">Suivre ma commande</a>
                      )}
                    </>
                  ) : paye ? (
                    <a
                      href={p.route ? `/api/books/${bookId}/${p.route}` : `/bibliotheque/${bookId}/${p.sku}`}
                      className="btn-primaire px-4 py-2 text-sm"
                    >
                      {p.route ? "Télécharger →" : "Ouvrir →"}
                    </a>
                  ) : (
                    <button
                      onClick={() => acheter(p.sku)}
                      disabled={pending || !accord}
                      className="btn-secondaire px-4 py-2 text-sm"
                    >
                      {encours === p.sku ? "Redirection…" : `Acheter (${formatEuros(p.priceCents)})`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <CaseConsentement coche={accord} onChange={setAccord} physique={produits.every((p) => p.physique)} />
      </div>

      {erreur && (
        <div className="mt-3">
          <Notice kind="erreur">{erreur}</Notice>
        </div>
      )}
    </div>
  );
}
