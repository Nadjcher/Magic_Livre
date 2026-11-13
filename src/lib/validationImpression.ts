/**
 * Validation du livre imprimé par le parent, AVANT l'envoi à l'imprimeur.
 *
 * Après le paiement, rien ne part chez Gelato : toutes les pages sont
 * dessinées, puis le parent reçoit un email « relisez votre livre ». Sur la
 * page du livre, il peut faire redessiner deux pages de plus, gratuitement,
 * puis il clique « Imprimer mon livre ». Sans réponse : rappel à 2 jours, puis
 * à 5 jours (« nous l'imprimons tel quel dans 2 jours »), et impression
 * automatique à 7 jours, pour qu'aucune commande payée ne reste en suspens.
 */

import "server-only";
import { prisma } from "./prisma";
import { storySchema, type Story } from "./storySchema";
import { emailAvecBouton } from "./mailer";
import { getAppUrl } from "./appUrl";

const JOUR = 86_400_000;
/** Retouches gratuites hors validation d'impression. */
export const RETOUCHES_DE_BASE = 5;
/** Pages refaites offertes pendant la validation du livre imprimé. */
export const RETOUCHES_VALIDATION = 2;

/** Nombre total de pages que ce livre peut faire redessiner. */
export function retouchesMax(story: Story): number {
  const v = story.impressionsAValider;
  if (!v?.length) return RETOUCHES_DE_BASE;
  const debut = Math.min(...v.map((x) => x.retouchesAuDebut));
  return Math.max(RETOUCHES_DE_BASE, debut + RETOUCHES_VALIDATION);
}

async function lire(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, title: true, pages: true, user: { select: { email: true } }, child: { select: { firstName: true } } },
  });
  const st = storySchema.safeParse(book?.pages);
  return book && st.success ? { book, story: st.data } : null;
}

async function emailValidation(bookId: string, sujet: string, titre: string, texte: string): Promise<void> {
  const l = await lire(bookId);
  if (!l?.book.user.email) return;
  await emailAvecBouton(l.book.user.email, sujet, titre, texte, `${getAppUrl()}/bibliotheque/${bookId}`, "Relire et imprimer");
}

/** Après le paiement d'un livre imprimé : on attend l'accord du parent. */
export async function demanderValidation(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { bookId: true } });
  if (!order) return;
  const l = await lire(order.bookId);
  if (!l) return;
  const deja = l.story.impressionsAValider ?? [];
  if (deja.some((x) => x.orderId === orderId) || l.story.impressions?.some((x) => x.orderId === orderId)) return;
  const maj: Story = {
    ...l.story,
    impressionsAValider: [...deja, { orderId, depuis: Date.now(), retouchesAuDebut: l.story.retouches ?? 0 }],
  };
  await prisma.book.update({ where: { id: order.bookId }, data: { pages: maj } });
  const prenom = l.book.child.firstName;
  await emailValidation(
    order.bookId,
    `Le livre de ${prenom} attend votre accord avant l'impression`,
    "Relisez votre livre, puis lancez l'impression",
    `Merci pour votre commande ! Avant d'envoyer « ${l.book.title} » à l'imprimeur, relisez-le tranquillement : toutes les pages sont maintenant illustrées. Si un dessin ne vous plaît pas, vous pouvez faire refaire ${RETOUCHES_VALIDATION} pages gratuitement. Quand tout vous convient, cliquez « Imprimer mon livre » : il arrive chez vous en 7 à 12 jours.`,
  );
}

/** Le parent valide : chaque commande en attente part chez l'imprimeur. */
export async function validerImpression(bookId: string, userId?: string): Promise<number> {
  const book = await prisma.book.findFirst({ where: { id: bookId, ...(userId ? { userId } : {}), deletedAt: null }, select: { pages: true } });
  const st = storySchema.safeParse(book?.pages);
  const aLancer = st.success ? (st.data.impressionsAValider ?? []) : [];
  if (!st.success || aLancer.length === 0) return 0;
  // Retire d'abord la demande (un double clic ne lance pas deux impressions).
  await prisma.book.update({ where: { id: bookId }, data: { pages: { ...st.data, impressionsAValider: undefined } } });
  const { lancerImpression } = await import("./print");
  for (const { orderId } of aLancer) await lancerImpression(orderId);
  return aLancer.length;
}

/** Passage quotidien : rappels, puis impression automatique au bout de 7 jours. */
export async function relancerValidations(): Promise<{ rappels: number; automatiques: number }> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Book" WHERE "deletedAt" IS NULL AND jsonb_array_length(COALESCE(pages->'impressionsAValider', '[]'::jsonb)) > 0`.catch(() => []);
  let rappels = 0;
  let automatiques = 0;
  for (const { id } of rows) {
    const l = await lire(id);
    const v = l?.story.impressionsAValider;
    if (!l || !v?.length) continue;
    const age = (Date.now() - Math.min(...v.map((x) => x.depuis))) / JOUR;
    const faites = Math.max(...v.map((x) => x.relances ?? 0));
    if (age >= 7) {
      automatiques += await validerImpression(id);
      continue;
    }
    const due = age >= 5 ? 2 : age >= 2 ? 1 : 0;
    if (due <= faites) continue;
    await prisma.book.update({
      where: { id },
      data: { pages: { ...l.story, impressionsAValider: v.map((x) => ({ ...x, relances: due })) } },
    });
    const prenom = l.book.child.firstName;
    await emailValidation(
      id,
      due === 2 ? `Nous imprimons le livre de ${prenom} dans 2 jours` : `Le livre de ${prenom} attend toujours votre accord`,
      due === 2 ? "Sans nouvelle de votre part, il part à l'impression tel quel" : "Un dernier coup d'œil avant l'impression ?",
      due === 2
        ? `« ${l.book.title} » n'est pas encore parti chez l'imprimeur, car nous attendons votre accord. Sans réponse d'ici 2 jours, nous l'imprimerons tel quel pour qu'il arrive à temps. Vous pouvez encore faire refaire ${RETOUCHES_VALIDATION} pages gratuitement.`
        : `« ${l.book.title} » est prêt, toutes ses pages sont illustrées. Relisez-le, faites refaire jusqu'à ${RETOUCHES_VALIDATION} pages si besoin, puis cliquez « Imprimer mon livre ».`,
    );
    rappels++;
  }
  return { rappels, automatiques };
}
