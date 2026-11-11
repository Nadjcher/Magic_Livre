/**
 * Chaîne de création d'un livre, en DEUX exécutions indépendantes (chacune
 * dispose de ses 5 minutes) pour qu'un livre ne plante plus par manque de temps :
 *
 *   1. écriture (texte enregistré tout de suite : l'histoire n'est jamais perdue) ;
 *   2. illustrations + réparation automatique des images ratées, puis « prêt »
 *      et email au parent.
 *
 * L'étape 2 est déclenchée par un appel interne signé (HMAC) ; si ce
 * déclenchement échoue, elle s'exécute sur place.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";
import { storySchema } from "./storySchema";
import { PAGES_APERCU, illustrateStory, illustrerEpisode } from "./storyGenerator";
import type { StoryRequest } from "./storyPrompt";
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

/** Étape 2 : illustre, répare, marque le livre prêt et prévient le parent. Ne jette jamais. */
export async function illustrerLivre({ bookId, req, portrait }: EtapeIllustration): Promise<void> {
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true, status: true } });
    const parsed = storySchema.safeParse(book?.pages);
    if (!book || !parsed.success || book.status !== "generating") return;

    const episode = Boolean(parsed.data.serie);
    const { story, imageReport } = episode
      ? await illustrerEpisode(parsed.data, req)
      : await illustrateStory(parsed.data, req, portrait);
    await prisma.book.update({
      where: { id: bookId },
      data: { status: "ready", title: story.titre, pages: story, errorMessage: imageReport ?? null },
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
    if (manquantes > 0 && /TOP_UP|locked|balance|crédit|credit/i.test(imageReport ?? "")) {
      // Compte fal bloqué : tous les livres suivants seraient sans images.
      await alerterAdmin(
        "crédit fal épuisé — les livres n'ont plus d'illustrations",
        `Rechargez le compte sur fal.ai (Billing). Livre ${bookId} : ${imageReport}`,
      );
    } else if (manquantes === total || manquantes >= total / 2) {
      await alerterAdmin("illustrations manquantes", imageReport ?? "raison inconnue (crédit fal épuisé ?)");
    }
    await notifierLivrePret(bookId);
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
