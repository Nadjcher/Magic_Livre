/**
 * Intégration Stripe (paiement unique via Checkout).
 *
 * La clé secrète reste côté serveur. Le téléchargement du PDF final n'est
 * autorisé qu'après validation du paiement par le webhook signé.
 */

import "server-only";
import Stripe from "stripe";
import { env } from "./env";

let cached: Stripe | null = null;

/** Retourne le client Stripe (créé paresseusement). */
export function getStripe(): Stripe {
  if (!cached) {
    cached = new Stripe(env.stripeSecretKey(), {
      apiVersion: "2024-11-20.acacia",
    });
  }
  return cached;
}

/**
 * Crée une session Stripe Checkout pour l'achat d'un livre donné.
 * Renvoie l'URL de redirection vers la page de paiement hébergée par Stripe.
 */
export async function createCheckoutSession(params: {
  userId: string;
  bookId: string;
  orderId: string;
  bookTitle: string;
  /** Montant à facturer en centimes (dépend de l'édition). */
  amountCents: number;
  /** true : édition premium (illustrations haut de gamme). */
  premium: boolean;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const baseUrl = env.authUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: env.bookCurrency(),
          unit_amount: params.amountCents,
          product_data: {
            name: `${params.premium ? "Édition premium" : "Livre"} : ${params.bookTitle}`,
            description: params.premium
              ? "PDF imprimable, illustrations haut de gamme et ressemblance renforcée."
              : "Version PDF imprimable de votre livre personnalisé.",
          },
        },
        quantity: 1,
      },
    ],
    // On rattache les identifiants pour les retrouver dans le webhook.
    // orderId permet de valider la commande même si l'enregistrement du
    // stripeSessionId a échoué côté application.
    metadata: {
      userId: params.userId,
      bookId: params.bookId,
      orderId: params.orderId,
    },
    success_url: `${baseUrl}/bibliotheque/${params.bookId}?paiement=succes`,
    cancel_url: `${baseUrl}/bibliotheque/${params.bookId}?paiement=annule`,
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  }

  return { sessionId: session.id, url: session.url };
}

/**
 * Vérifie la signature d'un événement de webhook Stripe et le renvoie.
 * Lève une erreur si la signature est invalide.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    env.stripeWebhookSecret(),
  );
}
