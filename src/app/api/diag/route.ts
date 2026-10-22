/**
 * Route de diagnostic TEMPORAIRE (à supprimer) : teste la base et le SMTP,
 * et liste la présence des variables (jamais les secrets eux-mêmes).
 */
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};

  // Base de données
  try {
    out.userCount = await prisma.user.count();
    out.db = "ok";
  } catch (e) {
    out.db = "error";
    out.dbError = String((e as Error)?.message ?? e).slice(0, 400);
  }

  // SMTP (vérifie la connexion/login sans envoyer d'email)
  try {
    const nm = (await import("nodemailer")).default;
    const transport = nm.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
    await transport.verify();
    out.smtp = "ok";
  } catch (e) {
    out.smtp = "error";
    out.smtpError = String((e as Error)?.message ?? e).slice(0, 400);
  }

  // Présence des variables (booléens / valeurs non secrètes seulement)
  out.env = {
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    emailHost: process.env.EMAIL_SERVER_HOST ?? null,
    emailPort: process.env.EMAIL_SERVER_PORT ?? null,
    emailUser: process.env.EMAIL_SERVER_USER ?? null,
    hasEmailPassword: Boolean(process.env.EMAIL_SERVER_PASSWORD),
    emailFrom: process.env.EMAIL_FROM ?? null,
    authUrl: process.env.AUTH_URL ?? null,
  };

  return Response.json(out);
}
