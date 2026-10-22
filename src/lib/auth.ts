/**
 * Configuration Auth.js (NextAuth v5) : connexion par email via lien magique.
 *
 * Utilise l'adaptateur Prisma et le fournisseur Nodemailer. Aucune donnée
 * sensible n'est exposée côté client : seules l'adresse email et l'état du
 * consentement parental sont ajoutés à la session.
 */

import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/connexion",
    verifyRequest: "/connexion/verifier",
  },
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // Email de connexion « conte enchanté », clair et rassurant.
      async sendVerificationRequest({ identifier, url, provider }) {
        const base = (process.env.AUTH_URL ?? "").replace(/\/$/, "");
        const { createTransport } = await import("nodemailer");
        const transport = createTransport(provider.server);
        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Votre lien de connexion — Mon Livre Magique",
          text:
            `Bonjour,\n\nVoici votre lien de connexion sécurisé à Mon Livre Magique :\n${url}\n\n` +
            `Ce lien est valable une seule fois et expire dans 24 h.\n\n` +
            `Vous recevez cet email car une connexion a été demandée avec cette adresse. ` +
            `Si ce n'est pas vous, ignorez simplement ce message, aucun compte n'est créé.\n\n` +
            `Confidentialité : ${base}/confidentialite`,
          html: `
<div style="margin:0;padding:24px;background:#fbf2df;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#2a2443">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e6dcc4">
    <div style="background:linear-gradient(135deg,#1b1544,#38316f);padding:28px 32px;text-align:center">
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ffffff">✦ Mon Livre Magique</div>
    </div>
    <div style="padding:32px">
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">Votre lien de connexion</h1>
      <p style="font-size:15px;line-height:1.6;color:#4a4466;margin:0 0 24px">
        Cliquez sur le bouton ci-dessous pour vous connecter. Pas de mot de passe à retenir&nbsp;: ce lien suffit.
      </p>
      <div style="text-align:center;margin:0 0 24px">
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#8b4fd4,#c45bb0);color:#ffffff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:999px">Se connecter</a>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#6f6690;margin:0 0 6px">
        Ce lien est valable une seule fois et expire dans 24&nbsp;heures.
      </p>
      <p style="font-size:13px;line-height:1.6;color:#6f6690;margin:0">
        Si le bouton ne fonctionne pas, copiez ce lien&nbsp;: <br>
        <a href="${url}" style="color:#8b4fd4;word-break:break-all">${url}</a>
      </p>
    </div>
    <div style="padding:20px 32px;background:#faf4e8;border-top:1px solid #e6dcc4;font-size:12px;line-height:1.6;color:#8278a6">
      Vous recevez cet email car une connexion a été demandée sur Mon Livre Magique avec cette adresse.
      Si ce n'est pas vous, ignorez ce message — aucun compte n'est créé sans votre action.<br>
      <a href="${base}/confidentialite" style="color:#8278a6">Confidentialité</a> ·
      <a href="${base}/cgu" style="color:#8278a6">CGU</a> ·
      Vous pourrez supprimer votre compte et toutes vos données à tout moment depuis « Mon compte ».
    </div>
  </div>
</div>`,
        });
      },
    }),
  ],
  callbacks: {
    // Ajoute l'identifiant et l'état de consentement à la session.
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
