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
  /** Produit physique expédié (adresse demandée au paiement). */
  physique?: boolean;
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
    "Le livre PDF + tout le kit, le Pack Fête, l'affiche A3 et le livre en dessin animé. " +
    "Le cadeau complet, au meilleur prix.",
  priceCents: 1699,
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
    label: "Le livre en dessin animé",
    emoji: "🎬",
    description:
      "Toute son histoire en vidéo : chaque page s'anime, une voix lit le texte " +
      "du début à la fin, en musique. Une vraie vidéo MP4 à partager en famille.",
    priceCents: 999,
    route: "",
  },
];

/** Livre imprimé et relié, expédié chez le client (imprimeur Gelato). */
export const LIVRE_IMPRIME: DeluxeProduct = {
  sku: "imprime",
  label: "Livre imprimé, couverture rigide",
  emoji: "📕",
  description:
    "Le vrai livre relié, 28 × 21 cm, couverture rigide, 30 pages sur papier épais : " +
    "l'histoire, ses personnages, des pages souvenir et à dessiner. Livré chez vous en 7 à 10 jours.",
  priceCents: 3490,
  route: "",
  physique: true,
};

/** Pays de livraison du livre imprimé. */
export const PAYS_LIVRAISON = ["FR", "BE", "LU", "CH", "MC", "DE", "ES", "IT", "NL", "PT", "AT", "IE"] as const;

/** Retrouve un produit deluxe par son sku. */
export function getDeluxeProduct(sku: string): DeluxeProduct | undefined {
  if (sku === LIVRE_IMPRIME.sku) return LIVRE_IMPRIME;
  return DELUXE_PRODUCTS.find((p) => p.sku === sku);
}

/** Formate un prix en centimes vers « 4,99 € ». */
export function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

/** Formules d'abonnement (paiement mensuel Stripe, sans engagement). */
export type PlanClub = "club" | "clubplus";
export const PLANS_CLUB: Record<PlanClub, { label: string; priceCents: number; livres: number; premium: boolean; avantages: string[] }> = {
  club: {
    label: "Le Club",
    priceCents: 999,
    livres: 4,
    premium: false,
    avantages: [
      "1 nouveau livre par semaine (4 par mois)",
      "Les grands classiques revisités, avec votre enfant en héros",
      "Le PDF et le kit de chaque livre inclus",
      "Le livre imprimé à 24,90 € au lieu de 34,90 €",
    ],
  },
  clubplus: {
    label: "Le Club+",
    priceCents: 1499,
    livres: 8,
    premium: true,
    avantages: [
      "2 nouveaux livres par semaine (8 par mois)",
      "Tous les livres en édition premium (illustrations haute qualité)",
      "Les grands classiques revisités",
      "Le PDF et le kit de chaque livre inclus",
      "Le livre imprimé à 24,90 € au lieu de 34,90 €",
    ],
  },
};
export const PRIX_IMPRIME_ABONNE = 2490;
