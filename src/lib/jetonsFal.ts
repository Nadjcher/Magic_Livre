/**
 * File d'attente vers fal : fal refuse plus de 10 requêtes simultanées par
 * compte. Le site tourne sur plusieurs serveurs à la fois (un par visiteur),
 * donc la limite se tient en base : 8 jetons partagés, un par requête en
 * cours. Une requête sans jeton libre attend son tour ; dix commandes en même
 * temps passent toutes, simplement plus lentement.
 *
 * Un jeton oublié (serveur coupé en pleine requête) se libère seul après
 * 4 minutes. Si la base ne répond pas, ou après 4 minutes d'attente, la
 * requête part quand même : la file ne bloque jamais un livre.
 */

import "server-only";
import { prisma } from "./prisma";

const JETONS = 8;
const ATTENTE_MAX_MS = 240_000;

let pret: Promise<void> | null = null;
function table(): Promise<void> {
  pret ??= (async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "JetonFal" (jeton INT PRIMARY KEY, "prisLe" TIMESTAMPTZ)`);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "JetonFal" (jeton) SELECT g FROM generate_series(1, ${JETONS}) g ON CONFLICT (jeton) DO NOTHING`,
    );
  })().catch((e) => {
    pret = null;
    throw e;
  });
  return pret;
}

async function prendre(): Promise<number | null> {
  const [r] = await prisma.$queryRaw<{ jeton: number }[]>`
    UPDATE "JetonFal" SET "prisLe" = NOW()
    WHERE jeton = (
      SELECT jeton FROM "JetonFal"
      WHERE "prisLe" IS NULL OR "prisLe" < NOW() - INTERVAL '4 minutes'
      ORDER BY jeton LIMIT 1 FOR UPDATE SKIP LOCKED
    )
    RETURNING jeton`;
  return r?.jeton ?? null;
}

/** Exécute `fn` en tenant un des jetons partagés (attend son tour si besoin). */
export async function avecJetonFal<T>(fn: () => Promise<T>): Promise<T> {
  let jeton: number | null = null;
  try {
    await table();
    const debut = Date.now();
    let pause = 800;
    while (jeton === null && Date.now() - debut < ATTENTE_MAX_MS) {
      jeton = await prendre();
      if (jeton === null) {
        await new Promise((r) => setTimeout(r, pause + Math.random() * 400));
        pause = Math.min(pause * 1.5, 4000);
      }
    }
    if (jeton === null) console.error("[fal] file d'attente : aucun jeton après 4 min, la requête part quand même");
  } catch (e) {
    console.error("[fal] file d'attente indisponible :", String(e).slice(0, 160));
  }
  try {
    return await fn();
  } finally {
    if (jeton !== null) {
      await prisma.$executeRaw`UPDATE "JetonFal" SET "prisLe" = NULL WHERE jeton = ${jeton}`.catch(() => undefined);
    }
  }
}

/**
 * `fetch` vers fal, dans la file d'attente. Le délai maximal (`delaiMs`) ne
 * démarre qu'une fois le jeton obtenu : l'attente dans la file ne compte pas.
 * La réponse est lue avant de rendre le jeton.
 */
export async function falFetch(url: string, init: RequestInit, delaiMs?: number): Promise<Response> {
  return avecJetonFal(async () => {
    const r = await fetch(url, delaiMs ? { ...init, signal: AbortSignal.timeout(delaiMs) } : init);
    // On garde le jeton jusqu'à la fin de la lecture : la requête est alors vraiment terminée chez fal.
    const corps = await r.arrayBuffer();
    return new Response(corps, { status: r.status, statusText: r.statusText, headers: r.headers });
  });
}
