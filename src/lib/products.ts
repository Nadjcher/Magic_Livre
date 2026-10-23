/**
 * Catalogue des produits « deluxe » vendus à l'unité, en plus du livre.
 *
 * Le livre (sku "book") débloque le kit inclus (coloriage, affiche, invitation,
 * autocollants, marque-pages, audio). Les produits ci-dessous s'achètent
 * séparément, chacun avec son propre prix et sa propre route de téléchargement.
 *
 * Source unique : ajouter un produit ici le rend vendable et téléchargeable
 * partout (vitrine, paiement, accès). 100 % numérique (fichiers à imprimer).
 */

export interface DeluxeProduct {
  /** Identifiant stable, stocké sur la commande (Order.sku). */
  sku: string;
  label: string;
  emoji: string;
  description: string;
  /** Prix en centimes. */
  priceCents: number;
  /** Chemin de téléchargement, relatif à /api/books/{id}/. */
  route: string;
}

export const DELUXE_PRODUCTS: DeluxeProduct[] = [
  {
    sku: "pack_fete",
    label: "Pack Fête d'anniversaire",
    emoji: "🎈",
    description:
      "Le kit complet pour sa fête : invitations, banderole à son prénom, " +
      "étiquettes-cadeaux et cartes de remerciement, à son image.",
    priceCents: 499,
    route: "pack-fete/pdf",
  },
  {
    sku: "affiche_a3",
    label: "Affiche grand format (A3)",
    emoji: "🪧",
    description:
      "Le héros en très grand format A3, qualité impression, idéal encadré " +
      "au-dessus du lit.",
    priceCents: 399,
    route: "affiche-a3/pdf",
  },
];

/** Retrouve un produit deluxe par son sku. */
export function getDeluxeProduct(sku: string): DeluxeProduct | undefined {
  return DELUXE_PRODUCTS.find((p) => p.sku === sku);
}

/** Formate un prix en centimes vers « 4,99 € ». */
export function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}
