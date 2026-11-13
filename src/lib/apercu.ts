/**
 * Livres gratuits = aperçu : l'histoire entière, la couverture et les
 * premières pages illustrées. Le reste est dessiné quand le livre est
 * débloqué (achat ou Club). Plus un plafond quotidien de livres gratuits,
 * pour protéger le budget d'illustration.
 */

import "server-only";
import { prisma } from "./prisma";
import { budgetDepasse } from "./budget";
import { reserver, liberer } from "./idempotence";
import { storySchema } from "./storySchema";
import { illustrerLivreComplet } from "./storyGenerator";
import { EN_COURS } from "./illustrationStatus";
import { getAbonnement } from "./subscription";
import { alerterAdmin } from "./notifications";
import type { IllustrationStyle } from "./style_config";

/** Livres gratuits par jour, pour tout le site. */
export function plafondGratuit(): number {
  const n = Number(process.env.FREE_BOOKS_PER_DAY ?? "20");
  return Number.isFinite(n) && n >= 0 ? n : 20;
}

function jourParis(): string {
  return new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" }); // AAAA-MM-JJ
}

/** Vrai si le plafond de livres gratuits du jour, ou le budget fal du jour, est atteint. */
export async function plafondGratuitAtteint(): Promise<boolean> {
  if (await budgetDepasse()) return true;
  try {
    const [r] = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*)::bigint AS n FROM "Traitement" WHERE cle LIKE ${`gratuit:${jourParis()}:%`}`;
    const atteint = Number(r?.n ?? 0) >= plafondGratuit();
    if (atteint) {
      await alerterAdmin(
        "plafond de livres gratuits atteint",
        `${plafondGratuit()} livres gratuits créés aujourd'hui : les suivants attendront demain. Variable FREE_BOOKS_PER_DAY pour le changer.`,
      );
    }
    return atteint;
  } catch {
    return false; // jamais bloquant en cas de souci de base
  }
}

/**
 * Un seul livre gratuit par compte : tant que son aperçu n'est pas acheté, le
 * parent n'en crée pas un second (chaque aperçu coûte ~0,30 € d'illustrations).
 * Un livre supprimé compte aussi, pour qu'on ne puisse pas recommencer en boucle.
 */
export async function aUnApercuNonAchete(userId: string): Promise<boolean> {
  try {
    const [r] = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*)::bigint AS n FROM "Book" b
      WHERE b."userId" = ${userId}
        AND b.status <> 'failed'
        AND EXISTS (SELECT 1 FROM "Traitement" t WHERE t.cle LIKE 'gratuit:%:' || b.id)
        AND NOT EXISTS (SELECT 1 FROM "Order" o WHERE o."bookId" = b.id AND o.status = 'paid')`;
    return Number(r?.n ?? 0) > 0;
  } catch {
    return false; // jamais bloquant en cas de souci de base
  }
}

/** Compte un livre gratuit pour aujourd'hui. */
export async function noterLivreGratuit(bookId: string): Promise<void> {
  await reserver(`gratuit:${jourParis()}:${bookId}`).catch(() => undefined);
}

/** Le livre peut-il être illustré en entier ? (payé, ou parent membre du Club) */
export async function peutDebloquer(userId: string, bookId: string): Promise<boolean> {
  const paye = await prisma.order.findFirst({ where: { bookId, userId, status: "paid" }, select: { id: true } });
  if (paye) return true;
  const ab = await getAbonnement(userId);
  return ab.actif;
}

/**
 * Illustre tout le livre (une seule fois, même si plusieurs appels arrivent).
 * Attend la fin : à appeler en arrière-plan (waitUntil) ou avant une impression.
 */
export async function debloquerLivre(bookId: string): Promise<void> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { pages: true, tier: true, child: { select: { firstName: true, age: true } } },
  });
  const parsed = storySchema.safeParse(book?.pages);
  if (!book || !parsed.success || !parsed.data.apercu) return;
  const cle = `debloquer:${bookId}`;
  if (!(await reserver(cle))) return;
  try {
    await prisma.book.update({ where: { id: bookId }, data: { errorMessage: `${EN_COURS}${Date.now()}` } });
    const story = parsed.data;
    const { story: complet, imageReport } = await illustrerLivreComplet(story, {
      childFirstName: book.child.firstName,
      childAge: book.child.age,
      mode: "theme",
      longueur: "moyenne",
      style: (story.style ?? "feerique") as IllustrationStyle,
      premium: book.tier === "premium",
    });
    // Relit le livre avant d'écrire (une retouche a pu arriver entre-temps).
    const frais = storySchema.safeParse((await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true } }))?.pages);
    const base = frais.success ? frais.data : story;
    const fusion = {
      ...base,
      apercu: false,
      couvertureUrl: base.couvertureUrl ?? complet.couvertureUrl ?? null,
      pages: base.pages.map((p, i) => ({ ...p, imageUrl: complet.pages[i]?.imageUrl ?? p.imageUrl ?? null })),
    };
    await prisma.book.update({ where: { id: bookId }, data: { pages: fusion, errorMessage: imageReport ?? null } });
  } catch (e) {
    await liberer(cle);
    await prisma.book.update({ where: { id: bookId }, data: { errorMessage: null } }).catch(() => undefined);
    console.error("[aperçu] déblocage interrompu", bookId, String(e).slice(0, 200));
  }
}
