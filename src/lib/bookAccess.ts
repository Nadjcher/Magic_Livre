/**
 * Accès contrôlé au contenu d'un livre pour les téléchargements (PDF couleur,
 * cahier de coloriage, poster, audio). Vérifie la connexion, la propriété, le
 * statut « ready » et l'existence d'un paiement validé.
 */

import "server-only";
import { getCurrentUser } from "./session";
import { prisma } from "./prisma";
import { storySchema, type Story } from "./storySchema";

export type BookAccess =
  | { ok: true; story: Story; bookId: string; title: string; childName: string }
  | { ok: false; status: number; error: string };

/**
 * Vérifie l'accès à un produit payé pour un livre donné. `sku` identifie le
 * produit acheté : "book" (le livre + le kit inclus) ou un produit deluxe
 * vendu à l'unité (ex. "pack_fete"). Renvoie l'histoire si une commande payée
 * existe pour ce sku.
 */
export async function getPaidProductStory(
  bookId: string,
  sku: string,
): Promise<BookAccess> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, error: "Non connecté." };

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id, deletedAt: null },
    include: { child: { select: { firstName: true } } },
  });
  if (!book) return { ok: false, status: 404, error: "Livre introuvable." };
  if (book.status !== "ready" || !book.pages) {
    return { ok: false, status: 409, error: "Le livre n'est pas encore prêt." };
  }

  const paid = await prisma.order.findFirst({
    where: { bookId: book.id, userId: user.id, status: "paid", sku },
  });
  if (!paid) {
    return { ok: false, status: 402, error: "Le téléchargement nécessite un paiement validé." };
  }

  const parsed = storySchema.safeParse(book.pages);
  if (!parsed.success) {
    return { ok: false, status: 500, error: "Le contenu du livre est corrompu." };
  }

  return {
    ok: true,
    story: parsed.data,
    bookId: book.id,
    title: book.title,
    childName: book.child.firstName,
  };
}

/** Accès au livre et au kit inclus : nécessite l'achat du livre (sku "book"). */
export async function getPaidBookStory(bookId: string): Promise<BookAccess> {
  return getPaidProductStory(bookId, "book");
}

/** Nettoie un titre pour un nom de fichier. */
export function safeFileName(title: string): string {
  return title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "livre";
}
