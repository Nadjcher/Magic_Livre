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

  try {
    const checkout = await createCheckoutSession({
      userId: user.id,
      bookId: book.id,
      bookTitle: book.title,
    });

    // Enregistre la commande en attente, reliée à la session Stripe.
    await prisma.order.create({
      data: {
        userId: user.id,
        bookId: book.id,
        stripeSessionId: checkout.sessionId,
        status: "pending",
        amount: env.bookPriceCents(),
        currency: env.bookCurrency(),
      },
    });

    return { ok: true, message: "", url: checkout.url };
  } catch {
    return {
      ok: false,
      message: "Le paiement est momentanément indisponible. Réessayez plus tard.",
    };
  }
}
