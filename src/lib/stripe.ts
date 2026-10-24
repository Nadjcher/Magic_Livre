/**
 * Intégration Stripe (paiement unique via Checkout).
 *
 * La clé secrète reste côté serveur. Le téléchargement du PDF final n'est
 * autorisé qu'après validation du paiement par le webhook signé.
 */

import "server-only";
import Stripe from "stripe";
import { env } from "./env";
import { prisma } from "./prisma";

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
  /** Nom du produit affiché sur la page de paiement Stripe. */
  productName: string;
  /** Description du produit affichée sur Stripe. */
  productDescription: string;
  /** Montant à facturer en centimes. */
  amountCents: number;
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
            name: params.productName,
            description: params.productDescription,
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
    success_url: `${baseUrl}/bibliotheque/${params.bookId}/boutique?paiement=succes&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/bibliotheque/${params.bookId}/boutique?paiement=annule`,
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

/**
 * Filet de sécurité au RETOUR de paiement : vérifie directement auprès de
 * Stripe que la session est payée, et marque la commande correspondante comme
 * payée. Ainsi le téléchargement se débloque même si le webhook est en retard,
 * mal configuré, ou perdu. Idempotent et sans danger (ne valide qu'une commande
 * appartenant à cet utilisateur et à ce livre). Ne jette jamais.
 *
 * Renvoie true si une commande a été (ou était déjà) confirmée payée.
 */
export async function confirmPaidSession(
  sessionId: string,
  userId: string,
  bookId: string,
): Promise<boolean> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return false;
    const orderId = session.metadata?.orderId;
    if (!orderId) return false;
    await prisma.order.updateMany({
      where: { id: orderId, userId, bookId, status: { not: "paid" } },
      data: { status: "paid", stripeSessionId: session.id },
    });
    return true;
  } catch {
    return false;
  }
}
