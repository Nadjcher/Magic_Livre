/**
 * Livres en attente d'illustrations : quand le compte fal est bloqué (crédit
 * épuisé), un livre n'échoue pas. Son texte est enregistré, il attend ici, le
 * parent voit « votre livre est dans la file d'attente » et l'admin est
 * alerté. Dès que le crédit revient (bouton dans l'atelier, passage quotidien,
 * ou premier livre réussi), les livres repartent, et le parent reçoit l'email
 * « votre livre est prêt ».
 *
 * La photo de l'enfant n'est jamais conservée : seule la demande sans photo
 * est gardée ; le héros validé (s'il existe) sert de nouveau d'ancre.
 */

import "server-only";
import { prisma } from "./prisma";
import { EN_ATTENTE_ILLUSTRATIONS } from "./illustrationStatus";
import type { StoryRequest } from "./storyPrompt";
import type { Story } from "./storySchema";

let pret: Promise<unknown> | null = null;
function table(): Promise<unknown> {
  pret ??= prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "LivreEnAttente" ("bookId" TEXT PRIMARY KEY, req JSONB NOT NULL, depuis TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
    )
    .catch((e) => {
      pret = null;
      throw e;
    });
  return pret;
}

/** Vrai si l'erreur fal signale un compte bloqué (crédit épuisé). */
export function falBloque(rapport: string | null | undefined): boolean {
  return /TOP_UP|locked|exhausted|balance/i.test(rapport ?? "");
}

export async function mettreEnAttente(bookId: string, req: StoryRequest, story: Story): Promise<void> {
  await table();
  const { photo: _photo, ...sansPhoto } = req;
  void _photo;
  await prisma.$executeRaw`
    INSERT INTO "LivreEnAttente" ("bookId", req) VALUES (${bookId}, ${JSON.stringify(sansPhoto)}::jsonb)
    ON CONFLICT ("bookId") DO UPDATE SET req = EXCLUDED.req`;
  await prisma.book.update({
    where: { id: bookId },
    data: { status: "draft", title: story.titre, pages: story, errorMessage: EN_ATTENTE_ILLUSTRATIONS },
  });
}

export async function nombreEnAttente(): Promise<number> {
  try {
    await table();
    const [r] = await prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*)::bigint AS n FROM "LivreEnAttente"`;
    return Number(r?.n ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Relance les livres en attente (les plus anciens d'abord), chacun dans sa
 * propre exécution. Si fal est toujours bloqué, ils reviennent simplement ici.
 */
export async function relancerEnAttente(max = 6): Promise<number> {
  await table();
  const rows = await prisma.$queryRaw<{ bookId: string; req: StoryRequest }[]>`
    DELETE FROM "LivreEnAttente" WHERE "bookId" IN (
      SELECT "bookId" FROM "LivreEnAttente" ORDER BY depuis LIMIT ${max} FOR UPDATE SKIP LOCKED
    ) RETURNING "bookId", req`;
  const { lancerIllustrations } = await import("./bookPipeline");
  const { lireHerosParId, refHeros } = await import("./heros");
  let n = 0;
  for (const { bookId, req } of rows) {
    const ok = await prisma.book.updateMany({
      where: { id: bookId, deletedAt: null, errorMessage: EN_ATTENTE_ILLUSTRATIONS },
      data: { status: "generating", errorMessage: null },
    });
    if (ok.count === 0) continue; // supprimé entre-temps
    const heros = req.herosId ? await lireHerosParId(req.herosId).catch(() => null) : null;
    const portrait = heros ? await refHeros(heros).catch(() => null) : null;
    await lancerIllustrations({ bookId, req, portrait });
    n++;
  }
  return n;
}
