/**
 * Notifications automatiques : livre prêt, achat confirmé (avec les liens de
 * téléchargement), et alertes pour l'administrateur (crédit IA épuisé…).
 */

import { liberer, reserver } from "./idempotence";
import "server-only";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";
import { emailAvecBouton } from "./mailer";
import { getDeluxeProduct, PACK_TOUT } from "./products";

const echapper = (t: string) => t.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

/** « Votre livre est prêt » (la création peut prendre quelques minutes). */
export async function notifierLivrePret(bookId: string): Promise<void> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { title: true, user: { select: { email: true } }, child: { select: { firstName: true } } },
  });
  if (!book?.user.email) return;
  await emailAvecBouton(
    book.user.email,
    `Le livre de ${book.child.firstName} est prêt ✨`,
    `« ${echapper(book.title)} » est prêt !`,
    `L'histoire de ${echapper(book.child.firstName)} est écrite et illustrée. Vous pouvez la lire gratuitement dès maintenant, puis la garder en PDF à imprimer si elle vous plaît.`,
    `${getAppUrl()}/bibliotheque/${bookId}`,
    "Lire le livre",
  );
}

/**
 * Actions au passage d'une commande à « payée » (appelé une seule fois, au
 * moment exact de la transition) : livre imprimé envoyé à l'imprimeur, ou
 * email avec les liens de téléchargement.
 */
export async function apresPaiement(orderId: string): Promise<void> {
  // Idempotence : une commande n'est traitée qu'UNE fois (pas de double impression
  // ni de double email), même si le webhook et le retour client arrivent ensemble.
  const cle = `apres-paiement:${orderId}`;
  if (!(await reserver(cle))) return;
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { sku: true } });
    if (order?.sku === "imprime") {
      const { lancerImpression } = await import("./print");
      await lancerImpression(orderId);
      return;
    }
    await notifierAchat(orderId);
  } catch (e) {
    await liberer(cle); // un prochain essai pourra refaire le traitement
    throw e;
  }
}

/** Confirmation d'achat avec le lien vers les téléchargements. */
export async function notifierAchat(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { sku: true, bookId: true, user: { select: { email: true } }, book: { select: { title: true } } },
  });
  if (!order?.user.email) return;
  const produit =
    order.sku === "book" ? "le livre PDF et son kit" : order.sku === PACK_TOUT.sku ? PACK_TOUT.label : getDeluxeProduct(order.sku)?.label ?? "votre achat";
  await emailAvecBouton(
    order.user.email,
    `Merci ! Vos téléchargements sont prêts`,
    "Merci pour votre achat 💙",
    `Votre paiement pour ${echapper(produit)} (« ${echapper(order.book.title)} ») est confirmé. Tout est disponible dans la boutique du livre, à télécharger quand vous voulez. ` +
      "Conformément à votre demande d'accès immédiat, vous avez renoncé à votre droit de rétractation pour ce contenu numérique (article L221-28, 13° du Code de la consommation).",
    `${getAppUrl()}/bibliotheque/${order.bookId}/boutique`,
    "Télécharger",
  );
}

/** Alerte pour les administrateurs (ADMIN_EMAILS), au plus une fois par heure et par sujet. */
const derniereAlerte = new Map<string, number>();
export async function alerterAdmin(sujet: string, detail: string): Promise<void> {
  console.error(`[alerte] ${sujet} — ${detail}`);
  const maintenant = Date.now();
  if ((derniereAlerte.get(sujet) ?? 0) > maintenant - 3_600_000) return;
  derniereAlerte.set(sujet, maintenant);
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  for (const a of admins) {
    await emailAvecBouton(a, `⚠️ Encore une histoire : ${sujet}`, sujet, echapper(detail), `${getAppUrl()}/api/health`, "Voir le diagnostic");
  }
}
