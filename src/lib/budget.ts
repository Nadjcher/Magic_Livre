/**
 * Garde-fou de facturation fal : chaque appel (texte, image, contrôle) ajoute
 * son coût au compteur du jour — le coût réel renvoyé par fal quand il existe,
 * sinon une estimation d'après la grille de prix. Au-delà du budget quotidien
 * (FAL_BUDGET_JOUR, en dollars, 10 par défaut), les créations GRATUITES
 * s'arrêtent jusqu'au lendemain (les achats et le Club continuent), et
 * l'administrateur reçoit un email.
 */

import "server-only";
import { prisma } from "./prisma";

/** Prix estimés (dollars) quand fal ne renvoie pas le coût réel. */
export const PRIX_ESTIMES = {
  texte: 0.15, // un appel d'écriture (Claude Opus, raisonnement compris)
  relecture: 0.03, // un appel de relecture (modèle plus petit)
  image: 0.045, // FLUX.2 Pro Edit, références comprises
  imagePremium: 0.08, // Nano Banana 2
  portrait: 0.03,
  vision: 0.001,
};

export function budgetJour(): number {
  const n = Number(process.env.FAL_BUDGET_JOUR ?? "10");
  return Number.isFinite(n) && n > 0 ? n : 10;
}

function jour(): string {
  return new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
}

let tablePrete: Promise<void> | null = null;
function assurerTable(): Promise<void> {
  tablePrete ??= prisma
    .$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "DepenseFal" (jour TEXT PRIMARY KEY, dollars DOUBLE PRECISION NOT NULL DEFAULT 0, appels INT NOT NULL DEFAULT 0)`)
    .then(() => undefined)
    .catch((e) => {
      tablePrete = null;
      throw e;
    });
  return tablePrete;
}

/** Ajoute une dépense au compteur du jour (best-effort, jamais bloquant). */
export async function noterDepense(dollars: number): Promise<void> {
  if (!(dollars > 0)) return;
  try {
    await assurerTable();
    await prisma.$executeRaw`
      INSERT INTO "DepenseFal" (jour, dollars, appels) VALUES (${jour()}, ${dollars}, 1)
      ON CONFLICT (jour) DO UPDATE SET dollars = "DepenseFal".dollars + ${dollars}, appels = "DepenseFal".appels + 1`;
  } catch {
    /* best-effort */
  }
}

/** Dépense estimée du jour, en dollars. */
export async function depenseDuJour(): Promise<{ dollars: number; appels: number }> {
  try {
    await assurerTable();
    const [r] = await prisma.$queryRaw<{ dollars: number; appels: number }[]>`SELECT dollars, appels FROM "DepenseFal" WHERE jour = ${jour()}`;
    return { dollars: Number(r?.dollars ?? 0), appels: Number(r?.appels ?? 0) };
  } catch {
    return { dollars: 0, appels: 0 };
  }
}

/** Les 14 derniers jours (tableau de bord admin). */
export async function depensesRecentes(): Promise<{ jour: string; dollars: number; appels: number }[]> {
  try {
    await assurerTable();
    return await prisma.$queryRaw<{ jour: string; dollars: number; appels: number }[]>`
      SELECT jour, dollars, appels FROM "DepenseFal" ORDER BY jour DESC LIMIT 14`;
  } catch {
    return [];
  }
}

/** Vrai si le budget du jour est dépassé (prévient l'admin une fois par heure). */
export async function budgetDepasse(): Promise<boolean> {
  const { dollars } = await depenseDuJour();
  if (dollars < budgetJour()) return false;
  const { alerterAdmin } = await import("./notifications");
  await alerterAdmin(
    "budget fal du jour atteint",
    `Environ ${dollars.toFixed(2)} $ dépensés aujourd'hui (budget : ${budgetJour()} $). Les créations gratuites sont suspendues jusqu'à demain ; les achats et le Club continuent. Variable FAL_BUDGET_JOUR pour changer le budget.`,
  );
  return true;
}
