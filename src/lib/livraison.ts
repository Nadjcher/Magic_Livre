/**
 * Livraison d'une histoire écrite, selon la règle des motifs éliminatoires :
 * - acceptée (ou juste sous le seuil) → enregistrée, puis illustrée ;
 * - motif éliminatoire (peur non résolue, erreur sur le prénom…) → une
 *   génération complète de plus, dans une nouvelle exécution ;
 * - encore un motif éliminatoire → rien n'est livré : le livre passe en
 *   relecture humaine, le parent est prévenu (sous 24 h), l'admin aussi.
 */

import "server-only";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";
import { signer, lancerIllustrations } from "./bookPipeline";
import { generateStory } from "./storyGenerator";
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

/** Enregistre et illustre, ou relance, ou envoie en relecture humaine. */
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
  await mettreEnRelecture(l.bookId, complete);
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
  const result = await generateStory(l.req, { illustrer: false });
  if (!result.ok) {
    await prisma.book.update({ where: { id: l.bookId }, data: { status: "failed", errorMessage: result.message } });
    return;
  }
  await livrer(l, result.story);
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
    "une histoire attend votre relecture (sous 24 h)",
    `Motif éliminatoire après deux générations : ${story.qualite?.eliminatoire ?? "?"}. Ouvrez l'atelier : ${getAppUrl()}/admin/histoires`,
  );
}

/** Vrai si ce livre est passé par la relecture humaine (le parent attend un email). */
export async function aEteEnRelecture(bookId: string): Promise<boolean> {
  const r = await prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*)::bigint AS n FROM "Traitement" WHERE cle = ${`relecture-email:${bookId}`}`.catch(() => []);
  return Number(r[0]?.n ?? 0) > 0;
}
