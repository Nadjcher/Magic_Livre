/**
 * Configuration Auth.js (NextAuth v5) : connexion par email + mot de passe.
 *
 * Session par jeton (JWT), mots de passe hachés avec bcrypt. La création de
 * compte se fait via l'action `register` (src/app/actions/auth.ts).
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { checkLoginRate } from "./rateLimitAuth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(creds, request) {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        // Anti-force-brute : plafonne les tentatives par email et par IP.
        const ip =
          (request?.headers?.get?.("x-forwarded-for") ?? "")
            .split(",")[0]
            ?.trim() || "unknown";
        const { allowed } = await checkLoginRate(email, ip);
        if (!allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
