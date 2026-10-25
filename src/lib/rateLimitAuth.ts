/**
 * Limitation anti-force-brute pour la connexion, via Upstash Redis.
 *
 * Repli gracieux : si UPSTASH_REDIS_REST_URL / _TOKEN ne sont pas configurés,
 * la limitation est simplement DÉSACTIVÉE (aucune erreur). Dès que les deux
 * variables sont présentes (compte Upstash gratuit), la protection s'active.
 *
 * En cas de panne de Redis, on n'enferme jamais les utilisateurs dehors : on
 * laisse passer (fail-open) — la sécurité ne doit pas casser le login légitime.
 */

import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Limiters = { email: Ratelimit; ip: Ratelimit } | null;

// undefined = pas encore initialisé ; null = désactivé (pas de config).
let cached: Limiters | undefined;

function getLimiters(): Limiters {
  if (cached !== undefined) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    cached = null;
    return null;
  }

  const redis = new Redis({ url, token });
  cached = {
    // Par adresse email : 8 tentatives / 10 min (anti-spraying ciblé).
    email: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(8, "10 m"),
      prefix: "mlm:auth:email",
      analytics: false,
    }),
    // Par IP : 40 tentatives / 10 min (tolère les réseaux partagés).
    ip: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, "10 m"),
      prefix: "mlm:auth:ip",
      analytics: false,
    }),
  };
  return cached;
}

/** Indique si une tentative de connexion est autorisée (email + IP). */
export async function checkLoginRate(
  email: string,
  ip: string,
): Promise<{ allowed: boolean }> {
  const lim = getLimiters();
  if (!lim) return { allowed: true }; // désactivé (pas d'Upstash)

  try {
    const [a, b] = await Promise.all([
      lim.email.limit(email || "unknown"),
      lim.ip.limit(ip || "unknown"),
    ]);
    return { allowed: a.success && b.success };
  } catch {
    // Panne Redis : on ne bloque pas les gens légitimes.
    return { allowed: true };
  }
}
