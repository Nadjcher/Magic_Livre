/**
 * Avis clients vérifiés : seuls les acheteurs d'un livre peuvent le noter
 * (une fois par livre). Les avis passent le filtre de contenu et peuvent être
 * masqués par l'administrateur. Tables créées automatiquement au premier usage.
 */

import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";

let pret: Promise<void> | null = null;
export function assurerTables(): Promise<void> {
  pret ??= (async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Review" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "bookId" TEXT NOT NULL REFERENCES "Book"(id) ON DELETE CASCADE,
      note INTEGER NOT NULL CHECK (note BETWEEN 1 AND 5),
      texte TEXT NOT NULL,
      auteur TEXT NOT NULL,
      visible BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE ("userId", "bookId")
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ReviewRequest" (
      "orderId" TEXT PRIMARY KEY,
      "sentAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  })().catch((e) => {
    pret = null;
    throw e;
  });
  return pret;
}

export interface Avis {
  id: string;
  note: number;
  texte: string;
  auteur: string;
  createdAt: Date;
  visible: boolean;
}

/** L'utilisateur a-t-il acheté ce livre (commande payée, Club compris) ? */
export async function aAchete(userId: string, bookId: string): Promise<boolean> {
  const n = await prisma.order.count({ where: { userId, bookId, status: "paid" } });
  return n > 0;
}

export async function avisDuLivre(userId: string, bookId: string): Promise<Avis | null> {
  await assurerTables();
  const r = await prisma.$queryRaw<Avis[]>`
    SELECT id, note, texte, auteur, "createdAt", visible FROM "Review" WHERE "userId" = ${userId} AND "bookId" = ${bookId}`;
  return r[0] ?? null;
}

export async function enregistrerAvis(userId: string, bookId: string, note: number, texte: string, auteur: string): Promise<void> {
  await assurerTables();
  await prisma.$executeRaw`
    INSERT INTO "Review" (id, "userId", "bookId", note, texte, auteur)
    VALUES (${randomUUID()}, ${userId}, ${bookId}, ${note}, ${texte}, ${auteur})
    ON CONFLICT ("userId", "bookId") DO UPDATE SET note = EXCLUDED.note, texte = EXCLUDED.texte, auteur = EXCLUDED.auteur, "createdAt" = NOW()`;
}

/** Avis publiés (les plus récents d'abord) et note moyenne. */
export async function avisPublics(limite = 50): Promise<{ avis: Avis[]; moyenne: number; total: number }> {
  try {
    await assurerTables();
    const avis = await prisma.$queryRaw<Avis[]>`
      SELECT id, note, texte, auteur, "createdAt", visible FROM "Review" WHERE visible ORDER BY "createdAt" DESC LIMIT ${limite}`;
    const s = await prisma.$queryRaw<{ total: bigint; moyenne: number | null }[]>`
      SELECT count(*) AS total, avg(note)::float AS moyenne FROM "Review" WHERE visible`;
    return { avis, total: Number(s[0]?.total ?? 0), moyenne: Math.round((s[0]?.moyenne ?? 0) * 10) / 10 };
  } catch {
    return { avis: [], moyenne: 0, total: 0 };
  }
}

/** Tous les avis (modération). */
export async function tousLesAvis(): Promise<Avis[]> {
  await assurerTables();
  return prisma.$queryRaw<Avis[]>`SELECT id, note, texte, auteur, "createdAt", visible FROM "Review" ORDER BY "createdAt" DESC LIMIT 200`;
}

export async function changerVisibilite(id: string, visible: boolean): Promise<void> {
  await assurerTables();
  await prisma.$executeRaw`UPDATE "Review" SET visible = ${visible} WHERE id = ${id}`;
}
