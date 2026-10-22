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

/**
 * Chaîne de connexion nettoyée des paramètres propres à Prisma/pgbouncer.
 * Opère uniquement sur la query (après « ? ») pour ne JAMAIS ré-encoder le
 * mot de passe (ce que ferait `new URL().toString()`).
 */
function neonConnectionString(): string {
  const raw = process.env.DATABASE_URL ?? "";
  const q = raw.indexOf("?");
  if (q === -1) return raw;
  const base = raw.slice(0, q);
  const retire = new Set(["pgbouncer", "connection_limit", "channel_binding"]);
  const params = raw
    .slice(q + 1)
    .split("&")
    .filter((kv) => kv && !retire.has(kv.split("=")[0] ?? ""));
  return params.length ? `${base}?${params.join("&")}` : base;
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
