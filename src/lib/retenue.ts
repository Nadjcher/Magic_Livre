/**
 * Un livre retenu par la porte de qualité : il n'est pas montré au parent, il
 * attend dans l'atelier (« Illustrations à relire »). Le parent est prévenu
 * une fois (« sous 48 h »), l'administrateur aussi, avec les raisons.
 */

import "server-only";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";
import { EN_RELECTURE_IMAGES } from "./illustrationStatus";
import type { Story } from "./storySchema";
import type { VerdictPorte } from "./porteQualite";

export async function retenirLivre(bookId: string, story: Story, verdict: VerdictPorte): Promise<void> {
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
