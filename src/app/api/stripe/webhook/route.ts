/**
 * Webhook Stripe signé. Marque la commande comme payée uniquement après
 * vérification de la signature. C'est la seule voie autorisant le
 * téléchargement du PDF final.
 */

import { NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

// Le webhook a besoin du corps brut pour vérifier la signature.
export const runtime = "nodejs";
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
    const bookId = session.metadata?.bookId;

    if (bookId && session.payment_status === "paid") {
      // Marque la commande liée à cette session comme payée.
      await prisma.order.updateMany({
        where: { stripeSessionId: session.id },
        data: { status: "paid" },
      });
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await prisma.order.updateMany({
      where: { stripeSessionId: session.id },
      data: { status: "failed" },
    });
  }

  // Stripe attend une réponse 200 pour cesser de renvoyer l'événement.
  return NextResponse.json({ received: true });
}
