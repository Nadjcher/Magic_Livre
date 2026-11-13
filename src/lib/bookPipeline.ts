/**
 * Chaîne de création d'un livre, en TROIS exécutions indépendantes (chacune
 * dispose de ses 5 minutes) pour qu'un livre ne plante plus par manque de temps :
 *
 *   1. écriture (texte enregistré tout de suite : l'histoire n'est jamais perdue) ;
 *   2. illustrations (si le crédit fal est épuisé, le livre attend son tour
 *      dans attenteIllustrations.ts au lieu d'échouer) ;
 *   3. relecture automatique des images, puis « prêt » et email au parent.
 *
 * Les étapes 2 et 3 sont déclenchées par un appel interne signé (HMAC) ; si
 * ce déclenchement échoue, elles s'exécutent sur place.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";
import { storySchema, type Story } from "./storySchema";
import { PAGES_APERCU, illustrateStory, illustrerEpisode } from "./storyGenerator";
import type { StoryRequest } from "./storyPrompt";
import { controleActif, controlerIllustrations } from "./controleIllustrations";
import { illustrationsEnabled } from "./illustration";
import { alerterAdmin, notifierLivrePret } from "./notifications";

export interface EtapeIllustration {
  bookId: string;
  req: StoryRequest;
  portrait: { base64: string; mime: string } | null;
}

function cle(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

export function signer(corps: string): string {
  return createHmac("sha256", cle()).update(corps).digest("hex");
}

export function signatureValide(corps: string, signature: string | null): boolean {
  if (!signature || !cle()) return false;
  const attendu = Buffer.from(signer(corps));
  const recu = Buffer.from(signature);
  return attendu.length === recu.length && timingSafeEqual(attendu, recu);
}

/** Déclenche l'étape 2 dans une nouvelle exécution ; sinon la fait sur place. */
export async function lancerIllustrations(etape: EtapeIllustration): Promise<void> {
  const corps = JSON.stringify(etape);
  try {
    const r = await fetch(`${getAppUrl()}/api/internal/illustrer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-signature": signer(corps) },
      body: corps,
      signal: AbortSignal.timeout(20_000),
    });
    if (r.status === 202) return;
    console.error("[livre] déclenchement des illustrations refusé :", r.status);
  } catch (e) {
    console.error("[livre] déclenchement des illustrations impossible :", String(e).slice(0, 160));
  }
  await illustrerLivre(etape);
}

/** Étape 2 : illustre, puis confie le livre à la relectrice (étape 3). Ne jette jamais. */
export async function illustrerLivre({ bookId, req, portrait }: EtapeIllustration): Promise<void> {
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true, status: true } });
    const parsed = storySchema.safeParse(book?.pages);
    if (!book || !parsed.success || book.status !== "generating") return;

    const episode = Boolean(parsed.data.serie);
    const relire = !episode && illustrationsEnabled() && controleActif();
    const { story, imageReport } = episode
      ? await illustrerEpisode(parsed.data, req)
      : await illustrateStory(parsed.data, req, portrait, { controle: !relire });
    const visibles = story.apercu ? story.pages.slice(0, PAGES_APERCU) : story.pages;
    const manquantes = (story.couvertureUrl ? 0 : 1) + visibles.filter((p) => !p.imageUrl).length;
    const { falBloque, mettreEnAttente } = await import("./attenteIllustrations");
    if (manquantes > 0 && falBloque(imageReport)) {
      // Compte fal bloqué : le livre attend son tour au lieu d'échouer.
      await mettreEnAttente(bookId, req, story);
      await alerterAdmin(
        "crédit fal épuisé — des livres attendent leurs illustrations",
        `Rechargez le compte sur fal.ai (Billing), puis cliquez « Relancer les livres en attente » dans l'atelier : ${getAppUrl()}/admin/histoires (sinon ils repartent seuls au prochain livre réussi, ou chaque nuit). Livre ${bookId} : ${imageReport}`,
      );
      return;
    }
    if (relire) {
      // Images enregistrées tout de suite (rien n'est perdu), puis relecture dans une nouvelle exécution.
      await prisma.book.update({ where: { id: bookId }, data: { title: story.titre, pages: story } });
      await lancerControle({ bookId, req: { ...req, photo: undefined }, imageReport: imageReport ?? null });
      return;
    }
    await terminerLivre(bookId, story, imageReport ?? null, episode);
  } catch (e) {
    console.error("[livre] illustrations interrompues", bookId, String(e).slice(0, 300));
    // Le texte est déjà enregistré : le livre devient lisible, et le parent
    // pourra compléter les illustrations depuis la page du livre.
    await prisma.book
      .update({
        where: { id: bookId },
        data: { status: "ready", errorMessage: "Illustrations manquantes : la création des images a été interrompue." },
      })
      .catch(() => undefined);
  }
}

export interface EtapeControle {
  bookId: string;
  req: StoryRequest;
  imageReport: string | null;
}

/** Déclenche l'étape 3 (relecture des images) dans une nouvelle exécution ; sinon sur place. */
async function lancerControle(etape: EtapeControle): Promise<void> {
  const corps = JSON.stringify(etape);
  try {
    const r = await fetch(`${getAppUrl()}/api/internal/controler`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-signature": signer(corps) },
      body: corps,
      signal: AbortSignal.timeout(20_000),
    });
    if (r.status === 202) return;
    console.error("[livre] déclenchement de la relecture refusé :", r.status);
  } catch (e) {
    console.error("[livre] déclenchement de la relecture impossible :", String(e).slice(0, 160));
  }
  await controlerLivre(etape);
}

/**
 * Étape 3 : la relectrice d'images, avec ses 5 minutes à elle (2 nouveaux
 * dessins par page fautive, puis une scène simplifiée), puis « prêt ». Ne jette jamais.
 */
export async function controlerLivre({ bookId, req, imageReport }: EtapeControle): Promise<void> {
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true, status: true } });
  const parsed = storySchema.safeParse(book?.pages);
  if (!book || !parsed.success || book.status !== "generating") return;
  let story = parsed.data;
  try {
    const r = await controlerIllustrations(story, req, Date.now() + 270_000);
    console.log("[livre]", r.bilan);
    story = r.story;
  } catch (e) {
    console.error("[livre] relecture des images interrompue", bookId, String(e).slice(0, 200));
  }
  await terminerLivre(bookId, story, imageReport, false);
}

/** Livre prêt : enregistré, parent prévenu, livres en attente relancés. */
async function terminerLivre(bookId: string, story: Story, imageReport: string | null, episode: boolean): Promise<void> {
  await prisma.book.update({
    where: { id: bookId },
    data: { status: "ready", title: story.titre, pages: story, errorMessage: imageReport },
  });
  if (episode) {
    // Un épisode se lit tout de suite dans l'application : pas d'email, sauf
    // s'il sort de relecture humaine (le parent attend d'être prévenu).
    const { aEteEnRelecture } = await import("./livraison");
    if (await aEteEnRelecture(bookId)) await notifierLivrePret(bookId);
    return;
  }
  const visibles = story.apercu ? story.pages.slice(0, PAGES_APERCU) : story.pages;
  const total = visibles.length + 1;
  const manquantes = (story.couvertureUrl ? 0 : 1) + visibles.filter((p) => !p.imageUrl).length;
  if (manquantes === total || manquantes >= total / 2) {
    await alerterAdmin("illustrations manquantes", imageReport ?? "raison inconnue (crédit fal épuisé ?)");
  }
  await notifierLivrePret(bookId);
  // Un livre complet : fal répond de nouveau, les livres en attente repartent.
  if (manquantes === 0) {
    const { nombreEnAttente, relancerEnAttente } = await import("./attenteIllustrations");
    if ((await nombreEnAttente()) > 0) await relancerEnAttente().catch(() => undefined);
  }
}
