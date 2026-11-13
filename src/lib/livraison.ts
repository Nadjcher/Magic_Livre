/**
 * Livraison d'une histoire écrite, selon la règle des motifs éliminatoires :
 * - acceptée (ou juste sous le seuil) → enregistrée, puis illustrée ;
 * - motif éliminatoire (peur non résolue, erreur sur le prénom…) → une
 *   génération complète de plus, dans une nouvelle exécution ;
 * - encore un motif éliminatoire → rien n'est livré : le parent est prévenu
 *   et invité à choisir une histoire toute prête (aucune relecture humaine).
 */

import "server-only";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";
import { signer, lancerIllustrations } from "./bookPipeline";
import { generateStory, relireHistoire } from "./storyGenerator";
import { EN_RELECTURE } from "./illustrationStatus";
import { reserver } from "./idempotence";
import type { Story } from "./storySchema";
import type { StoryRequest } from "./storyPrompt";

export interface Livraison {
  bookId: string;
  req: StoryRequest;
  portrait: { base64: string; mime: string } | null;
  /** Champs ajoutés à l'histoire avant l'enregistrement (série : épisode, fiches, style). */
  complement?: Partial<Story>;
  tentative: 1 | 2;
}

function eliminee(story: Story): boolean {
  return Boolean(story.qualite?.eliminatoire) && !story.qualite?.accepte;
}

/** Enregistre et illustre, ou relance, ou renonce poliment. */
export async function livrer(l: Livraison, story: Story): Promise<void> {
  const complete = { ...story, ...l.complement } as Story;
  if (!eliminee(complete)) {
    await prisma.book.update({ where: { id: l.bookId }, data: { title: complete.titre, pages: complete } });
    await lancerIllustrations({ bookId: l.bookId, req: l.req, portrait: l.portrait });
    return;
  }
  if (l.tentative === 1) {
    console.log("[livraison] motif éliminatoire, nouvelle génération complète", l.bookId, complete.qualite?.eliminatoire);
    await lancerSecondeGeneration({ ...l, tentative: 2 });
    return;
  }
  await renoncer(l.bookId, complete);
}

/**
 * Deux générations refusées pour un motif éliminatoire : pas de relecture
 * humaine. Le livre est marqué « échoué » avec un message clair, le parent est
 * prévenu et son essai gratuit reste disponible (un livre échoué ne compte pas).
 */
async function renoncer(bookId: string, story: Story): Promise<void> {
  await prisma.book.update({
    where: { id: bookId },
    data: {
      status: "failed",
      title: story.titre,
      errorMessage:
        "Nous n'avons pas réussi à écrire une histoire assez belle à partir de cette idée. Essayez l'une de nos histoires toutes prêtes, comme « Le Petit Poucet » : votre essai gratuit reste disponible.",
    },
  });
  const { notifierEchecHistoire, alerterAdmin } = await import("./notifications");
  if (await reserver(`echec-email:${bookId}`)) await notifierEchecHistoire(bookId).catch(() => undefined);
  await alerterAdmin(
    "une histoire libre a été abandonnée (pour information)",
    `Livre ${bookId}, motif éliminatoire après deux générations : ${story.qualite?.eliminatoire ?? "?"}. Le parent a été invité à choisir une histoire toute prête.`,
  );
}

/** Deuxième génération complète, dans sa propre exécution (5 minutes à elle). */
async function lancerSecondeGeneration(l: Livraison): Promise<void> {
  const corps = JSON.stringify(l);
  try {
    const r = await fetch(`${getAppUrl()}/api/internal/reecrire`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-signature": signer(corps) },
      body: corps,
      signal: AbortSignal.timeout(20_000),
    });
    if (r.status === 202) return;
  } catch {
    /* repli ci-dessous */
  }
  await secondeGeneration(l);
}

export async function secondeGeneration(l: Livraison): Promise<void> {
  const result = await generateStory(l.req, { illustrer: false, relire: false });
  if (!result.ok) {
    await prisma.book.update({ where: { id: l.bookId }, data: { status: "failed", errorMessage: result.message } });
    return;
  }
  await lancerRelecture(l, result.story);
}

/**
 * Étape 2 de la chaîne : la relecture notée (et jusqu'à deux réécritures), dans
 * sa propre exécution, puis la livraison. L'écriture d'une longue histoire et sa
 * relecture ne tiendraient pas ensemble dans les 5 minutes d'une exécution.
 */
export async function lancerRelecture(l: Livraison, story: Story): Promise<void> {
  const corps = JSON.stringify({ l, story });
  try {
    const r = await fetch(`${getAppUrl()}/api/internal/relire`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-signature": signer(corps) },
      body: corps,
      signal: AbortSignal.timeout(20_000),
    });
    if (r.status === 202) return;
  } catch {
    /* repli ci-dessous */
  }
  await relireEtLivrer(l, story);
}

export async function relireEtLivrer(l: Livraison, story: Story): Promise<void> {
  try {
    const relue = await relireHistoire(story, l.req);
    await livrer(l, relue);
  } catch (e) {
    console.error("[livraison] relecture interrompue", l.bookId, String(e).slice(0, 200));
    await livrer(l, story); // jamais bloquant : l'histoire non relue part quand même
  }
}

/** Rien n'est livré : relecture humaine, parent et admin prévenus. */
export async function mettreEnRelecture(bookId: string, story: Story): Promise<void> {
  await prisma.book.update({
    where: { id: bookId },
    data: {
      status: "draft",
      title: story.titre,
      pages: { ...story, qualite: story.qualite ? { ...story.qualite, aRevoir: true } : undefined },
      errorMessage: EN_RELECTURE,
    },
  });
  const { notifierRelecture, alerterAdmin } = await import("./notifications");
  // Le parent n'est prévenu qu'une fois, même si l'histoire repasse en relecture.
  if (await reserver(`relecture-email:${bookId}`)) await notifierRelecture(bookId).catch(() => undefined);
  await alerterAdmin(
    "une histoire attend votre relecture (sous 48 h)",
    `Motif éliminatoire après deux générations : ${story.qualite?.eliminatoire ?? "?"}. Ouvrez l'atelier : ${getAppUrl()}/admin/histoires`,
  );
}

/** Vrai si ce livre est passé par la relecture humaine (le parent attend un email). */
export async function aEteEnRelecture(bookId: string): Promise<boolean> {
  const r = await prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*)::bigint AS n FROM "Traitement" WHERE cle = ${`relecture-email:${bookId}`}`.catch(() => []);
  return Number(r[0]?.n ?? 0) > 0;
}
