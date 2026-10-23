"use client";

/**
 * Demande de réinitialisation de mot de passe : saisie de l'email.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import Notice from "@/components/Notice";
import EnTetePage from "@/components/EnTetePage";
import { requestPasswordReset } from "@/app/actions/auth";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const form = new FormData();
      form.set("email", email);
      const res = await requestPasswordReset(form);
      setMessage(res.message);
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <EnTetePage surtitre="Pas de panique" titre="Mot de passe oublié">
        Entrez votre adresse email : nous vous enverrons un lien pour choisir un
        nouveau mot de passe.
      </EnTetePage>

      <form onSubmit={handleSubmit} className="carte-relief mt-6 space-y-4 p-6">
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
          className="champ"
        />
        <button type="submit" className="btn-primaire w-full" disabled={pending}>
          {pending ? "Envoi…" : "Envoyer le lien"}
        </button>
        {message && <Notice kind="succes">{message}</Notice>}
        <p className="pt-1 text-center text-sm text-magique-texteClair">
          <Link href="/connexion" className="font-semibold text-magique-primaire hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
