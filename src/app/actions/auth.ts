"use server";

/**
 * Création de compte par email + mot de passe. Le mot de passe est haché
 * (bcrypt) avant stockage ; jamais conservé en clair.
 */

import { headers } from "next/headers";
import { checkLoginRate } from "@/lib/rateLimitAuth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, sendResetEmail, consumeToken } from "@/lib/mailer";

export interface RegisterResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(formData: FormData): Promise<RegisterResult> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Adresse email invalide." };
  }
  // Anti-abus : création de comptes en série depuis la même adresse IP.
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "inconnue";
  const { allowed } = await checkLoginRate(`inscription:${email}`, `inscription:${ip}`);
  if (!allowed) return { ok: false, message: "Trop d'essais. Réessayez dans quelques minutes." };
  if (password.length < 8) {
    return { ok: false, message: "Le mot de passe doit faire au moins 8 caractères." };
  }
  if (password !== confirm) {
    return { ok: false, message: "Les deux mots de passe ne correspondent pas." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.passwordHash) {
    return { ok: false, message: "Un compte existe déjà avec cet email. Connectez-vous." };
  }
  if (existing) {
    // Compte sans mot de passe (créé via un ancien lien email) : on le réclame.
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
  } else {
    await prisma.user.create({ data: { email, passwordHash } });
  }

  // Email de confirmation (non bloquant : l'inscription réussit même si l'envoi échoue).
  try {
    await sendVerificationEmail(email);
  } catch {
    /* ignore */
  }
  return { ok: true, message: "" };
}

/** Demande de réinitialisation : envoie un email si le compte existe. */
export async function requestPasswordReset(formData: FormData): Promise<RegisterResult> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (EMAIL_RE.test(email)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      try {
        await sendResetEmail(email);
      } catch {
        /* ignore */
      }
    }
  }
  // Réponse générique : on ne révèle pas si l'adresse existe.
  return {
    ok: true,
    message: "Si un compte existe pour cette adresse, un email de réinitialisation vient d'être envoyé.",
  };
}

/** Réinitialise le mot de passe à partir d'un jeton reçu par email. */
export async function resetPassword(formData: FormData): Promise<RegisterResult> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { ok: false, message: "Le mot de passe doit faire au moins 8 caractères." };
  }
  if (password !== confirm) {
    return { ok: false, message: "Les deux mots de passe ne correspondent pas." };
  }

  const valide = await consumeToken(`reset:${email}`, token);
  if (!valide) {
    return { ok: false, message: "Lien invalide ou expiré. Refaites une demande." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { email }, data: { passwordHash } });
  return { ok: true, message: "" };
}
