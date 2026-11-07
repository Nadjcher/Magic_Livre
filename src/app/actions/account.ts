"use server";

/**
 * Server Actions du compte : changement de mot de passe, renvoi de l'email de
 * confirmation, suppression du compte (RGPD).
 *
 * Fiabilité / sécurité :
 *  - toute action sensible redemande le mot de passe actuel ;
 *  - tentatives plafonnées (même limiteur anti-force-brute que la connexion) ;
 *  - changer le mot de passe déconnecte TOUS les appareils (empreinte dans la
 *    session, cf. lib/session.ts).
 */

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { checkLoginRate } from "@/lib/rateLimitAuth";
import { sendVerificationEmail } from "@/lib/mailer";

export interface AccountResult {
  ok: boolean;
  message: string;
}

async function clientIp(): Promise<string> {
  return ((await headers()).get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
}

/** Vérifie le mot de passe actuel (avec limitation des tentatives). */
async function verifierMotDePasse(
  user: { email: string; passwordHash: string | null },
  password: string,
): Promise<AccountResult | null> {
  const { allowed } = await checkLoginRate(user.email, await clientIp());
  if (!allowed) {
    return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
  }
  if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return { ok: false, message: "Mot de passe actuel incorrect." };
  }
  return null;
}

export async function changePassword(formData: FormData): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Votre session a expiré. Reconnectez-vous." };

  const actuel = String(formData.get("current") ?? "");
  const nouveau = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (nouveau.length < 8) {
    return { ok: false, message: "Le nouveau mot de passe doit faire au moins 8 caractères." };
  }
  if (nouveau.length > 200) return { ok: false, message: "Mot de passe trop long." };
  if (nouveau !== confirm) {
    return { ok: false, message: "Les deux nouveaux mots de passe ne correspondent pas." };
  }
  if (nouveau === actuel) {
    return { ok: false, message: "Le nouveau mot de passe doit être différent de l'actuel." };
  }

  const refus = await verifierMotDePasse(user, actuel);
  if (refus) return refus;

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(nouveau, 10) },
  });
  // Toutes les sessions (y compris celle-ci) sont invalidées : on se reconnecte.
  await signOut({ redirect: false });
  return {
    ok: true,
    message: "Mot de passe modifié. Par sécurité, tous vos appareils ont été déconnectés.",
  };
}

export async function resendVerification(): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Votre session a expiré. Reconnectez-vous." };
  if (user.emailVerified) return { ok: true, message: "Votre adresse est déjà confirmée." };
  try {
    await sendVerificationEmail(user.email);
  } catch {
    return { ok: false, message: "L'email n'a pas pu être envoyé. Réessayez plus tard." };
  }
  return { ok: true, message: `Email de confirmation envoyé à ${user.email}.` };
}

/**
 * Supprime le compte et toutes les données associées (enfants, livres,
 * commandes, sessions) via les relations onDelete: Cascade. Exige le mot de
 * passe pour éviter une suppression depuis un appareil laissé ouvert.
 */
export async function deleteAccount(formData: FormData): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Votre session a expiré. Reconnectez-vous." };

  if (String(formData.get("confirmation") ?? "").trim().toUpperCase() !== "SUPPRIMER") {
    return { ok: false, message: "Tapez SUPPRIMER pour confirmer." };
  }
  const refus = await verifierMotDePasse(user, String(formData.get("password") ?? ""));
  if (refus) return refus;

  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirect: false });
  return { ok: true, message: "Votre compte et toutes vos données ont été supprimés." };
}
