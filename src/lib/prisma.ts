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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
