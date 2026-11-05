/**
 * Livres de démonstration (vidéos, réseaux sociaux) rangés à part dans la
 * bibliothèque de l'administrateur. Table créée au premier usage.
 */

import "server-only";
import { prisma } from "./prisma";

let tablePrete: Promise<void> | null = null;
function assurerTable(): Promise<void> {
  tablePrete ??= prisma
    .$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "LivreDemo" ("bookId" TEXT PRIMARY KEY, "userId" TEXT NOT NULL)`)
    .then(() => undefined)
    .catch((e) => {
      tablePrete = null;
      throw e;
    });
  return tablePrete;
}

export async function livresDemo(userId: string): Promise<Set<string>> {
  try {
    await assurerTable();
    const r = await prisma.$queryRaw<{ bookId: string }[]>`SELECT "bookId" FROM "LivreDemo" WHERE "userId" = ${userId}`;
    return new Set(r.map((x) => x.bookId));
  } catch {
    return new Set();
  }
}

export async function basculerDemo(userId: string, bookId: string): Promise<boolean> {
  await assurerTable();
  const n = await prisma.$executeRaw`DELETE FROM "LivreDemo" WHERE "bookId" = ${bookId} AND "userId" = ${userId}`;
  if (n > 0) return false;
  await prisma.$executeRaw`INSERT INTO "LivreDemo" ("bookId", "userId") VALUES (${bookId}, ${userId}) ON CONFLICT DO NOTHING`;
  return true;
}
