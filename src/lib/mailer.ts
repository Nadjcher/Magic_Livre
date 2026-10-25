/**
 * Envoi d'emails (SMTP) + jetons à usage unique (table VerificationToken).
 * Sert à la validation d'adresse et à la réinitialisation de mot de passe.
 */

import "server-only";
import { createTransport } from "nodemailer";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";

// URL publique normalisée : garantit des liens d'email toujours valides.
const baseUrl = () => getAppUrl();

/**
 * Limite anti-spam : nombre de jetons encore valides pour un identifiant.
 * Sert à plafonner les envois d'emails (réinitialisation / confirmation) et à
 * éviter le « mail bombing ». Approxime la récence via la date d'expiration.
 */
async function activeTokenCount(identifier: string): Promise<number> {
  return prisma.verificationToken.count({
    where: { identifier, expires: { gt: new Date() } },
  });
}

/** Gabarit HTML « conte enchanté » commun à tous les emails. */
function shell(titre: string, corps: string): string {
  return `
<div style="margin:0;padding:24px;background:#eef2fd;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1b2250">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e6dcc4">
    <div style="background:linear-gradient(135deg,#16245c,#33407f);padding:28px 32px;text-align:center">
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ffffff">✦ Mon Livre Magique</div>
    </div>
    <div style="padding:32px">
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">${titre}</h1>
      ${corps}
    </div>
    <div style="padding:20px 32px;background:#faf4e8;border-top:1px solid #e6dcc4;font-size:12px;line-height:1.6;color:#8278a6">
      <a href="${baseUrl()}/confidentialite" style="color:#8278a6">Confidentialité</a> ·
      <a href="${baseUrl()}/cgu" style="color:#8278a6">CGU</a> ·
      Vous pouvez supprimer votre compte et vos données à tout moment depuis « Mon compte ».
    </div>
  </div>
</div>`;
}

function bouton(url: string, label: string): string {
  return `<div style="text-align:center;margin:8px 0 24px">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#4f6ef0,#8b5ae0);color:#ffffff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:999px">${label}</a>
  </div>
  <p style="font-size:13px;line-height:1.6;color:#5b6598;margin:0">Si le bouton ne fonctionne pas, copiez ce lien :<br>
  <a href="${url}" style="color:#4f5fe0;word-break:break-all">${url}</a></p>`;
}

export async function sendMail(to: string, subject: string, html: string, text: string) {
  const transport = createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
  await transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, html, text });
}

/** Crée un jeton à usage unique pour `identifier`, valable `heures`. */
export async function createToken(identifier: string, heures: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + heures * 3_600_000) },
  });
  return token;
}

/** Vérifie et consomme (supprime) un jeton. true si valide. */
export async function consumeToken(identifier: string, token: string): Promise<boolean> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row || row.identifier !== identifier || row.expires < new Date()) return false;
  await prisma.verificationToken.delete({ where: { token } });
  return true;
}

/** Email de confirmation d'adresse. */
export async function sendVerificationEmail(email: string) {
  // Anti-spam : pas plus de quelques emails de confirmation actifs à la fois.
  if ((await activeTokenCount(`verify:${email}`)) >= 3) return;
  const token = await createToken(`verify:${email}`, 24);
  const url = `${baseUrl()}/verifier-email?token=${token}&email=${encodeURIComponent(email)}`;
  await sendMail(
    email,
    "Confirmez votre adresse — Mon Livre Magique",
    shell(
      "Bienvenue ! Confirmez votre adresse",
      `<p style="font-size:15px;line-height:1.6;color:#3a4472;margin:0 0 16px">Merci d'avoir créé votre compte. Confirmez votre adresse email pour finaliser l'inscription.</p>${bouton(url, "Confirmer mon adresse")}`,
    ),
    `Confirmez votre adresse : ${url}`,
  );
}

/** Email de réinitialisation de mot de passe. */
export async function sendResetEmail(email: string) {
  // Anti-spam / anti « mail bombing » : plafond d'emails de reset actifs.
  if ((await activeTokenCount(`reset:${email}`)) >= 3) return;
  const token = await createToken(`reset:${email}`, 1);
  const url = `${baseUrl()}/reinitialiser?token=${token}&email=${encodeURIComponent(email)}`;
  await sendMail(
    email,
    "Réinitialiser votre mot de passe — Mon Livre Magique",
    shell(
      "Réinitialiser votre mot de passe",
      `<p style="font-size:15px;line-height:1.6;color:#3a4472;margin:0 0 16px">Vous avez demandé à changer votre mot de passe. Ce lien est valable 1 heure.</p>${bouton(url, "Choisir un nouveau mot de passe")}<p style="font-size:13px;color:#5b6598;margin:16px 0 0">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
    ),
    `Réinitialiser votre mot de passe : ${url}`,
  );
}
