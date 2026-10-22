"use server";

/**
 * Création de compte par email + mot de passe. Le mot de passe est haché
 * (bcrypt) avant stockage ; jamais conservé en clair.
 */

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
    return { ok: true, message: "" };
  }

  await prisma.user.create({ data: { email, passwordHash } });
  return { ok: true, message: "" };
}
