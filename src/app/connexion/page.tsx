"use client";

/**
 * Connexion par email + mot de passe.
 */

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Notice from "@/components/Notice";
import EnTetePage from "@/components/EnTetePage";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setErreur("Email ou mot de passe incorrect.");
      } else {
        router.push("/bibliotheque");
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-2">
      <div className="order-2 md:order-1">
        <EnTetePage surtitre="Content de vous revoir" titre="Connexion">
          Entrez votre email et votre mot de passe pour accéder à vos histoires.
        </EnTetePage>

        <form onSubmit={handleSubmit} className="carte-relief mt-6 space-y-4 p-6">
          <div>
            <label className="block text-sm font-semibold" htmlFor="email">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@exemple.com"
              className="champ mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="champ mt-1"
            />
          </div>
          <button type="submit" className="btn-primaire w-full" disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </button>
          {erreur && <Notice kind="erreur">{erreur}</Notice>}
          <p className="pt-1 text-center text-sm text-magique-texteClair">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-semibold text-magique-primaire hover:underline">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
      <div className="order-1 mx-auto max-w-xs md:order-2 md:max-w-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/gen/login.webp"
          alt="Une enveloppe scellée d'une étoile"
          className="w-full"
        />
      </div>
    </div>
  );
}
