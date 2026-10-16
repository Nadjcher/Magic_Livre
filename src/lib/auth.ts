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
