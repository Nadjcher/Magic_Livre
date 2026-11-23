/**
 * Un livre retenu par la porte de qualité : il n'est pas montré au parent, il
 * attend dans l'atelier (« Illustrations à relire »). Le parent est prévenu
 * une fois (« sous 48 h »), l'administrateur aussi, avec les raisons.
 */

import "server-only";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";
import { EN_RELECTURE_IMAGES } from "./illustrationStatus";
import { storySchema, type Story } from "./storySchema";
import type { VerdictPorte } from "./porteQualite";

/**
 * Ce qui a pu être écrit sur le livre PENDANT sa fabrication ou sa vérification (plusieurs minutes) :
 * une commande d'impression en attente d'accord, une impression lancée, une page refaite. On le relit
 * juste avant d'écrire, pour ne jamais l'effacer (sinon : commande payée, jamais imprimée).
 */
export async function avecDonneesFraiches(bookId: string, story: Story): Promise<Story> {
  try {
    const livre = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true } });
    const frais = storySchema.safeParse(livre?.pages);
    if (!frais.success) return story;
    const retouches = Math.max(frais.data.retouches ?? 0, story.retouches ?? 0);
    return {
      ...story,
      impressionsAValider: frais.data.impressionsAValider ?? story.impressionsAValider,
      impressions: frais.data.impressions ?? story.impressions,
      ...(retouches ? { retouches } : {}),
    };
  } catch {
    return story;
  }
}

export async function retenirLivre(bookId: string, histoire: Story, verdict: VerdictPorte): Promise<void> {
  const story = await avecDonneesFraiches(bookId, histoire);
  await prisma.book.update({
    where: { id: bookId },
    data: {
      status: "draft",
      title: story.titre,
      pages: { ...story, imagesARevoir: verdict.pages, retenue: verdict.raisons.map((r) => r.slice(0, 400)).slice(0, 8) },
      errorMessage: EN_RELECTURE_IMAGES,
    },
  });
  const { reserver } = await import("./idempotence");
  const { notifierRelecture, alerterAdmin } = await import("./notifications");
  if (await reserver(`relecture-email:${bookId}`)) await notifierRelecture(bookId).catch(() => undefined);
  await alerterAdmin(
    "un livre est retenu avant l'envoi au parent",
    `Livre ${bookId} (« ${story.titre} ») : ${verdict.raisons.join(" ; ")}. Ouvrez l'atelier : ${getAppUrl()}/admin/histoires`,
  ).catch(() => undefined);
}
