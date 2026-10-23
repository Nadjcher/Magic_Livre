"use server";

/**
 * Server Action : démarrage du paiement Stripe pour télécharger un livre.
 * Crée une commande « pending » puis une session Checkout, et renvoie l'URL
 * de redirection vers Stripe.
 */

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";
import { env } from "@/lib/env";

export interface CheckoutResult {
  ok: boolean;
  message: string;
  url?: string;
}

export async function startCheckout(bookId: string): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id, deletedAt: null },
  });
  if (!book) return { ok: false, message: "Livre introuvable." };
  if (book.status !== "ready") {
    return { ok: false, message: "Le livre n'est pas encore prêt." };
  }

  // Si déjà payé, inutile de repayer.
  const existingPaid = await prisma.order.findFirst({
    where: { bookId: book.id, userId: user.id, status: "paid" },
  });
  if (existingPaid) {
    return { ok: false, message: "Ce livre est déjà payé. Vous pouvez le télécharger." };
  }

  // Montant selon l'édition : premium plus cher que standard.
  const premium = book.tier === "premium";
  const amountCents = premium ? env.bookPricePremiumCents() : env.bookPriceCents();

  try {
    // 1. On crée d'abord la commande en attente (sans stripeSessionId).
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        bookId: book.id,
        status: "pending",
        amount: amountCents,
        currency: env.bookCurrency(),
      },
    });

    // 2. On crée la session Stripe en lui passant l'identifiant de commande.
    const checkout = await createCheckoutSession({
      userId: user.id,
      bookId: book.id,
      orderId: order.id,
      bookTitle: book.title,
      amountCents,
      premium,
    });

    // 3. On relie la session à la commande (le webhook sait de toute façon
    //    retrouver la commande via orderId présent dans les métadonnées).
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
