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
  /** Chemin de téléchargement, relatif à /api/books/{id}/ (vide = page dédiée). */
  route: string;
}

/**
 * Formule « Tout compris » : le livre + le kit + TOUS les produits deluxe, à
 * prix réduit. Une commande « tout » débloque chacun de ces produits.
 */
export const PACK_TOUT = {
  sku: "tout",
  label: "Formule Tout compris",
  emoji: "👑",
  description:
    "Le livre PDF + tout le kit, le Pack Fête, l'affiche A3 et la vidéo souvenir. " +
    "Le cadeau complet, au meilleur prix.",
  priceCents: 1299,
} as const;

/** Produits débloqués par la formule « Tout compris ». */
export const INCLUS_DANS_TOUT = ["book", "pack_fete", "affiche_a3", "video"];

/** SKUs qui donnent accès au produit `sku` (lui-même, ou la formule complète). */
export function skusDonnantAcces(sku: string): string[] {
  return INCLUS_DANS_TOUT.includes(sku) ? [sku, PACK_TOUT.sku] : [sku];
}

/** Liste des produits possédés à partir des commandes payées. */
export function skusPossedes(payes: string[]): string[] {
  return payes.includes(PACK_TOUT.sku) ? Array.from(new Set([...payes, ...INCLUS_DANS_TOUT])) : payes;
}

export const DELUXE_PRODUCTS: DeluxeProduct[] = [
  {
    sku: "pack_fete",
    label: "Pack Fête d'anniversaire",
    emoji: "🎈",
    description:
      "Le kit complet pour sa fête : invitations, banderole à son prénom, " +
      "étiquettes-cadeaux et cartes de remerciement, à son image.",
    priceCents: 299,
    route: "pack-fete/pdf",
  },
  {
    sku: "affiche_a3",
    label: "Affiche grand format (A3)",
    emoji: "🪧",
    description:
      "Le héros en très grand format A3, qualité impression, idéal encadré " +
      "au-dessus du lit.",
    priceCents: 199,
    route: "affiche-a3/pdf",
  },
  {
    sku: "video",
    label: "Vidéo souvenir",
    emoji: "🎬",
    description:
      "L'histoire en vidéo : les illustrations s'animent doucement, le texte " +
      "défile en musique. À regarder ensemble ou à partager avec la famille.",
    priceCents: 299,
    route: "",
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
