/**
 * Mémoire de l'enfant : sa fiche pour les histoires (objet fétiche, ce qu'il
 * aime, ce qui lui fait peur, les proches à citer). Renseignée par le parent,
 * jamais inventée ; aucune photo. Supprimée avec l'enfant (ON DELETE CASCADE).
 */

import "server-only";
import { prisma } from "./prisma";
import type { FicheEnfant } from "./storyPrompt";

let tablePrete: Promise<void> | null = null;
function assurerTable(): Promise<void> {
  tablePrete ??= prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "FicheEnfant" (
        "childId" TEXT PRIMARY KEY REFERENCES "Child"(id) ON DELETE CASCADE,
        objet TEXT, aime TEXT, peur TEXT, proches TEXT,
        "majLe" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )
    .then(() => undefined)
    .catch((e) => {
      tablePrete = null;
      throw e;
    });
  return tablePrete;
}

export async function lireFiches(childIds: string[]): Promise<Map<string, FicheEnfant>> {
  const m = new Map<string, FicheEnfant>();
  if (!childIds.length) return m;
  try {
    await assurerTable();
    const rows = await prisma.$queryRaw<(FicheEnfant & { childId: string })[]>`
      SELECT "childId", objet, aime, peur, proches FROM "FicheEnfant" WHERE "childId" = ANY(${childIds})`;
    for (const r of rows) m.set(r.childId, { objet: r.objet ?? undefined, aime: r.aime ?? undefined, peur: r.peur ?? undefined, proches: r.proches ?? undefined });
  } catch (e) {
    console.error("[fiche enfant]", String(e).slice(0, 160));
  }
  return m;
}

export async function lireFiche(childId: string): Promise<FicheEnfant | undefined> {
  return (await lireFiches([childId])).get(childId);
}

export async function ecrireFiche(childId: string, f: FicheEnfant): Promise<void> {
  await assurerTable();
  const v = (x?: string) => (x?.trim() ? x.trim().slice(0, 160) : null);
  await prisma.$executeRaw`
    INSERT INTO "FicheEnfant" ("childId", objet, aime, peur, proches, "majLe")
    VALUES (${childId}, ${v(f.objet)}, ${v(f.aime)}, ${v(f.peur)}, ${v(f.proches)}, NOW())
    ON CONFLICT ("childId") DO UPDATE SET objet = EXCLUDED.objet, aime = EXCLUDED.aime, peur = EXCLUDED.peur,
      proches = EXCLUDED.proches, "majLe" = NOW()`;
}
