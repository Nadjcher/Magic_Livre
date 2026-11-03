"use server";

/**
 * Abonnement « Club » : souscription (Stripe Checkout, paiement mensuel),
 * résiliation à la fin de la période et réactivation.
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/appUrl";
import { PLANS_CLUB, type PlanClub } from "@/lib/products";
import { getAbonnement, synchroniser } from "@/lib/subscription";
import { VERSION_CGV } from "@/lib/legal";
import { MESSAGE_FERME, ventesOuvertes } from "@/lib/lancement";
import { estAdmin } from "@/lib/rateLimit";

export interface ClubResult {
  ok: boolean;
  message: string;
  url?: string;
}

export async function startClub(plan: PlanClub, consentement: boolean): Promise<ClubResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Créez un compte ou connectez-vous pour rejoindre le Club." };
  if (!ventesOuvertes() && !estAdmin(user.email)) return { ok: false, message: MESSAGE_FERME };
  if (!consentement) return { ok: false, message: "Merci d'accepter les conditions générales de vente." };
  const def = PLANS_CLUB[plan];
  if (!def) return { ok: false, message: "Formule inconnue." };

  const ab = await getAbonnement(user.id);
  if (ab.actif) return { ok: false, message: `Vous êtes déjà membre du ${ab.label}. Gérez votre abonnement dans « Mon compte ».` };

  try {
    const base = getAppUrl();
    const meta = { userId: user.id, plan, consentement: `cgv+renonciation-retractation v${VERSION_CGV} ${new Date().toISOString()}` };
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: def.priceCents,
            recurring: { interval: "month" },
            product_data: { name: `${def.label} — Encore une histoire`, description: def.avantages.join(" · ") },
          },
          quantity: 1,
        },
      ],
      ...(ab.stripeCustomerId ? { customer: ab.stripeCustomerId } : { customer_email: user.email }),
      client_reference_id: user.id,
      metadata: meta,
      subscription_data: { metadata: meta },
      success_url: `${base}/api/stripe/retour-club?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/club?annule=1`,
    });
    if (!session.url) return { ok: false, message: "Le paiement n'a pas pu être lancé. Réessayez." };
    return { ok: true, message: "", url: session.url };
  } catch (e) {
    console.error("[club] souscription :", String(e).slice(0, 200));
    return { ok: false, message: "Le paiement n'a pas pu être lancé. Réessayez dans un instant." };
  }
}

/** Résilie à la fin de la période déjà payée (les livres restent acquis). */
export async function cancelClub(): Promise<ClubResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };
  const ab = await getAbonnement(user.id);
  if (!ab.stripeSubscriptionId || !ab.actif) return { ok: false, message: "Aucun abonnement actif." };
  try {
    await getStripe().subscriptions.update(ab.stripeSubscriptionId, { cancel_at_period_end: true });
    await synchroniser(ab.stripeSubscriptionId);
    revalidatePath("/compte");
    return { ok: true, message: `Résiliation enregistrée. Votre abonnement reste actif jusqu'au ${ab.periodEnd?.toLocaleDateString("fr-FR") ?? "terme"}.` };
  } catch {
    return { ok: false, message: "La résiliation n'a pas pu être enregistrée. Réessayez." };
  }
}

/** Annule une résiliation programmée. */
export async function resumeClub(): Promise<ClubResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };
  const ab = await getAbonnement(user.id);
  if (!ab.stripeSubscriptionId || !ab.actif) return { ok: false, message: "Aucun abonnement actif." };
  try {
    await getStripe().subscriptions.update(ab.stripeSubscriptionId, { cancel_at_period_end: false });
    await synchroniser(ab.stripeSubscriptionId);
    revalidatePath("/compte");
    return { ok: true, message: "Votre abonnement continue. Ravis de vous garder !" };
  } catch {
    return { ok: false, message: "La réactivation n'a pas pu être enregistrée. Réessayez." };
  }
}
