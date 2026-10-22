/**
 * Client Prisma unique (singleton), branché sur le driver serverless Neon.
 *
 * La connexion passe par WebSocket (et non TCP classique) : c'est la méthode
 * recommandée pour Vercel + Neon. Elle réveille de façon fiable un compute en
 * veille (plan gratuit), ce qui évite les erreurs « Can't reach database ».
 */

import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Node (runtime serverless Vercel) n'a pas de WebSocket natif : on fournit `ws`.
neonConfig.webSocketConstructor = ws;
// Les requêtes simples passent par HTTP (fetch) : plus robuste en serverless et
// réveille le compute en veille sans « Connection terminated unexpectedly ».
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Chaîne de connexion nettoyée des paramètres propres à Prisma/pgbouncer. */
function neonConnectionString(): string {
  const raw = process.env.DATABASE_URL ?? "";
  try {
    const u = new URL(raw);
    ["pgbouncer", "connection_limit", "channel_binding"].forEach((p) =>
      u.searchParams.delete(p),
    );
    return u.toString();
  } catch {
    return raw;
  }
}

function createPrisma(): PrismaClient {
  const pool = new Pool({ connectionString: neonConnectionString() });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
