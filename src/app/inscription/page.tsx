"use client";

/**
 * Création de compte par email + mot de passe. Après inscription, on connecte
 * automatiquement l'utilisateur.
 */

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Notice from "@/components/Notice";
import EnTetePage from "@/components/EnTetePage";
import { register } from "@/app/actions/auth";

export default function InscriptionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    startTransition(async () => {
      const form = new FormData();
      form.set("email", email);
      form.set("password", password);
      form.set("confirm", confirm);
      const res = await register(form);
      if (!res.ok) {
        setErreur(res.message);
        return;
      }
      // Connexion automatique après création.
      const login = await signIn("credentials", { email, password, redirect: false });
      if (login?.error) {
        router.push("/connexion");
      } else {
        router.push("/creer");
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-2">
      <div className="order-2 md:order-1">
        <EnTetePage surtitre="Bienvenue" titre="Créer un compte">
          Un email, un mot de passe, et vous pourrez créer des histoires pour
          votre enfant.
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
              Mot de passe <span className="font-normal text-magique-texteClair">(8 caractères min.)</span>
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="champ mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="confirm">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="champ mt-1"
            />
          </div>
          <button type="submit" className="btn-primaire w-full" disabled={pending}>
            {pending ? "Création…" : "Créer mon compte"}
          </button>
          {erreur && <Notice kind="erreur">{erreur}</Notice>}
          <p className="text-center text-xs text-magique-texteClair">
            En créant un compte, vous acceptez les{" "}
            <Link href="/cgu" className="underline">CGU</Link> et la{" "}
            <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.
            Vous pourrez supprimer votre compte et vos données à tout moment.
          </p>
          <p className="pt-1 text-center text-sm text-magique-texteClair">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-semibold text-magique-primaire hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
      <div className="order-1 mx-auto max-w-xs md:order-2 md:max-w-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/feerique/login.webp"
          alt="Une enveloppe scellée d'une étoile"
          className="w-full"
        />
      </div>
    </div>
  );
}
