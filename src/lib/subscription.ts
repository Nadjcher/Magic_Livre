/**
 * Abonnement « Club » : état de l'abonnement Stripe d'un utilisateur et quota
 * de livres inclus sur la période en cours.
 *
 * Stockage : table "Subscription", créée automatiquement au premier usage
 * (aucune migration manuelle). Les livres inclus sont des commandes « book »
 * payées à 0 € : l'accès aux téléchargements réutilise la logique existante.
 */

import "server-only";
import type Stripe from "stripe";
import { prisma } from "./prisma";
import { getStripe } from "./stripe";
import { PLANS_CLUB, type PlanClub } from "./products";

let tablePrete: Promise<void> | null = null;
export function assurerTable(): Promise<void> {
  tablePrete ??= prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "Subscription" (
        "userId" TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
        "stripeCustomerId" TEXT,
        "stripeSubscriptionId" TEXT UNIQUE,
        "plan" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "periodStart" TIMESTAMPTZ,
        "periodEnd" TIMESTAMPTZ,
        "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT FALSE,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )
    .then(() => undefined)
    .catch((e) => {
      tablePrete = null;
      throw e;
    });
  return tablePrete;
}

type Ligne = {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: string;
  status: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export interface Abonnement {
  actif: boolean;
  plan: PlanClub | null;
  label: string;
  status: string | null;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  quota: number;
  utilises: number;
  restants: number;
  premium: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

const AUCUN: Abonnement = {
  actif: false, plan: null, label: "", status: null, periodEnd: null, cancelAtPeriodEnd: false,
  quota: 0, utilises: 0, restants: 0, premium: false, stripeCustomerId: null, stripeSubscriptionId: null,
};

/** Abonnement de l'utilisateur (jamais d'exception : en cas de souci, « aucun »). */
export async function getAbonnement(userId: string): Promise<Abonnement> {
  try {
    await assurerTable();
    const rows = await prisma.$queryRaw<Ligne[]>`
      SELECT "stripeCustomerId", "stripeSubscriptionId", plan, status, "periodStart", "periodEnd", "cancelAtPeriodEnd"
      FROM "Subscription" WHERE "userId" = ${userId}`;
    const r = rows[0];
    if (!r) return AUCUN;
    const plan = (r.plan in PLANS_CLUB ? r.plan : "club") as PlanClub;
    const def = PLANS_CLUB[plan];
    const actif = ["active", "trialing"].includes(r.status) && (!r.periodEnd || r.periodEnd.getTime() > Date.now());
    const debut = r.periodStart ?? new Date(Date.now() - 30 * 86400_000);
    const utilises = actif
      ? await prisma.order.count({
          where: { userId, sku: "book", amount: 0, status: "paid", createdAt: { gte: debut }, book: { status: { not: "failed" } } },
        })
      : 0;
    return {
      actif,
      plan,
      label: def.label,
      status: r.status,
      periodEnd: r.periodEnd,
      cancelAtPeriodEnd: r.cancelAtPeriodEnd,
      quota: def.livres,
      utilises,
      restants: actif ? Math.max(0, def.livres - utilises) : 0,
      premium: actif && def.premium,
      stripeCustomerId: r.stripeCustomerId,
      stripeSubscriptionId: r.stripeSubscriptionId,
    };
  } catch (e) {
    console.error("[club] lecture impossible :", String(e).slice(0, 160));
    return AUCUN;
  }
}

/** Dates de période (selon la version de l'API Stripe : sur l'abonnement ou sur l'article). */
function periode(sub: Stripe.Subscription): { debut: Date | null; fin: Date | null } {
  const s = sub as unknown as { current_period_start?: number; current_period_end?: number; items?: { data?: { current_period_start?: number; current_period_end?: number }[] } };
  const d = s.current_period_start ?? s.items?.data?.[0]?.current_period_start;
  const f = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return { debut: d ? new Date(d * 1000) : null, fin: f ? new Date(f * 1000) : null };
}

/** Recopie l'état d'un abonnement Stripe dans la base. */
export async function synchroniser(subscriptionId: string): Promise<void> {
  await assurerTable();
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error("[club] abonnement sans userId", subscriptionId);
    return;
  }
  const planBrut = sub.metadata?.plan ?? "club";
  const plan = (planBrut in PLANS_CLUB ? planBrut : "club") as PlanClub;
  const { debut, fin } = periode(sub);
  const client = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  await prisma.$executeRaw`
    INSERT INTO "Subscription" ("userId", "stripeCustomerId", "stripeSubscriptionId", plan, status, "periodStart", "periodEnd", "cancelAtPeriodEnd", "updatedAt")
    VALUES (${userId}, ${client}, ${sub.id}, ${plan}, ${sub.status}, ${debut}, ${fin}, ${sub.cancel_at_period_end}, NOW())
    ON CONFLICT ("userId") DO UPDATE SET
      "stripeCustomerId" = EXCLUDED."stripeCustomerId",
      "stripeSubscriptionId" = EXCLUDED."stripeSubscriptionId",
      plan = EXCLUDED.plan, status = EXCLUDED.status,
      "periodStart" = EXCLUDED."periodStart", "periodEnd" = EXCLUDED."periodEnd",
      "cancelAtPeriodEnd" = EXCLUDED."cancelAtPeriodEnd", "updatedAt" = NOW()`;
}

/**
 * Consomme un livre inclus pour ce livre (commande « book » payée à 0 €).
 * Renvoie true si le livre est inclus dans l'abonnement.
 */
export async function inclureLivre(userId: string, bookId: string, ab: Abonnement): Promise<boolean> {
  if (!ab.actif || ab.restants <= 0) return false;
  try {
    await prisma.order.create({
      data: { userId, bookId, sku: "book", status: "paid", amount: 0, currency: "eur" },
    });
    return true;
  } catch (e) {
    console.error("[club] inclusion du livre impossible :", String(e).slice(0, 160));
    return false;
  }
}
