/**
 * Extension des types de Auth.js pour exposer l'identifiant utilisateur dans
 * la session côté serveur.
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
