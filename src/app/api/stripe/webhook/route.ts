/**
 * Webhook Stripe signé. Marque la commande comme payée uniquement après
 * vérification de la signature. C'est la seule voie autorisant le
 * téléchargement du PDF final.
 */

import { NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { apresPaiement } from "@/lib/notifications";
import { marquerEchouee, marquerPayee } from "@/lib/orders";
import { waitUntil } from "@vercel/functions";
import type Stripe from "stripe";

// Le webhook a besoin du corps brut pour vérifier la signature.
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, signature);
  } catch {
    // Signature invalide : on refuse sans détailler l'erreur.
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId && session.payment_status === "paid") {
      // On retrouve la commande via orderId (robuste même si l'enregistrement
      // du stripeSessionId avait échoué). On rattache la session au passage.
      const nouveau = await marquerPayee(orderId, { sessionId: session.id });
      // Email de confirmation (une seule fois : au passage à « payé »).
      // Fabrication du livre imprimé (long) en arrière-plan : on répond vite à Stripe.
      if (nouveau) waitUntil(apresPaiement(orderId).catch(() => undefined));
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await marquerEchouee(orderId);
    }
  }

  // Stripe attend une réponse 200 pour cesser de renvoyer l'événement.
  return NextResponse.json({ received: true });
}
