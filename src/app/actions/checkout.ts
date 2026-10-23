"use server";

/**
 * Server Action : démarrage d'un paiement Stripe.
 * - sku "book" : achat du livre (édition standard ou premium) → débloque le
 *   kit inclus.
 * - sku d'un produit deluxe (ex. "pack_fete") : achat à l'unité.
 * Crée une commande « pending » puis une session Checkout, et renvoie l'URL.
 */

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";
import { env } from "@/lib/env";
import { getDeluxeProduct } from "@/lib/products";

export interface CheckoutResult {
  ok: boolean;
  message: string;
  url?: string;
}

export async function startCheckout(
  bookId: string,
  sku = "book",
): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id, deletedAt: null },
  });
  if (!book) return { ok: false, message: "Livre introuvable." };
  if (book.status !== "ready") {
    return { ok: false, message: "Le livre n'est pas encore prêt." };
  }

  // Détermine le produit : le livre, ou un produit deluxe du catalogue.
  let amountCents: number;
  let productName: string;
  let productDescription: string;

  if (sku === "book") {
    const premium = book.tier === "premium";
    amountCents = premium ? env.bookPricePremiumCents() : env.bookPriceCents();
    productName = `${premium ? "Édition premium" : "Livre"} : ${book.title}`;
    productDescription = premium
      ? "PDF imprimable, illustrations haut de gamme + kit inclus (coloriage, affiche, invitation, autocollants, marque-pages, audio)."
      : "Livre PDF imprimable + kit inclus (coloriage, affiche, invitation, autocollants, marque-pages, audio).";
  } else {
    const product = getDeluxeProduct(sku);
    if (!product) return { ok: false, message: "Produit inconnu." };
    amountCents = product.priceCents;
    productName = `${product.label} — ${book.title}`;
    productDescription = product.description;
  }

  // Déjà acheté ? (une commande payée pour ce produit et ce livre.)
  const existingPaid = await prisma.order.findFirst({
    where: { bookId: book.id, userId: user.id, sku, status: "paid" },
  });
  if (existingPaid) {
    return {
      ok: false,
      message:
        sku === "book"
          ? "Ce livre est déjà payé. Vous pouvez le télécharger."
          : "Ce produit est déjà acheté. Vous pouvez le télécharger.",
    };
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        bookId: book.id,
        sku,
        status: "pending",
        amount: amountCents,
        currency: env.bookCurrency(),
      },
    });

    const checkout = await createCheckoutSession({
      userId: user.id,
      bookId: book.id,
      orderId: order.id,
      productName,
      productDescription,
      amountCents,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkout.sessionId },
    });

    return { ok: true, message: "", url: checkout.url };
  } catch {
    return {
      ok: false,
      message: "Le paiement est momentanément indisponible. Réessayez plus tard.",
    };
  }
}
