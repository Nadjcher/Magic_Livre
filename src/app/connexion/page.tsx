"use client";

/**
 * Page de connexion par lien magique (email). Aucun mot de passe.
 */

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import Notice from "@/components/Notice";
import EnTetePage from "@/components/EnTetePage";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setErreur(null);
    startTransition(async () => {
      try {
        const res = await signIn("nodemailer", {
          email,
          redirect: false,
          callbackUrl: "/bibliotheque",
        });
        if (res?.error) {
          setErreur("L'envoi du lien a échoué. Vérifiez votre adresse et réessayez.");
        } else {
          setMessage(
            "Un lien de connexion vient de vous être envoyé par email. Consultez votre boîte de réception.",
          );
        }
      } catch {
        setErreur("Une erreur est survenue. Réessayez plus tard.");
      }
    });
  }

  return (
    <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-2">
      <div className="order-2 md:order-1">
      <EnTetePage surtitre="Rapide et sécurisé" titre="Connexion">
        Continuez avec Google, ou recevez un lien de connexion par email.
      </EnTetePage>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/bibliotheque" })}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border-2 border-magique-trait bg-white px-6 py-3 font-bold text-magique-texte shadow-sm transition hover:-translate-y-0.5 hover:shadow-conte"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.5-.2-2.6-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 15.5 2 8.1 6.8 4.5 13.9z" />
          <path fill="#4CAF50" d="M24 46c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 36.5 26.9 37.5 24 37.5c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 41.2 16.3 46 24 46z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.6 5.6C40.9 36.9 46 31 46 24c0-1.5-.2-2.6-.4-3.5z" />
        </svg>
        Continuer avec Google
      </button>

      <div className="my-5 flex items-center gap-3 text-sm text-magique-texteClair">
        <span className="h-px flex-1 bg-magique-trait" /> ou par email <span className="h-px flex-1 bg-magique-trait" />
      </div>

      <form onSubmit={handleSubmit} className="carte-relief space-y-4 p-6">
        <label className="block text-sm font-semibold" htmlFor="email">
          Adresse email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="parent@exemple.com"
          className="champ"
        />
        <button type="submit" className="btn-primaire w-full" disabled={pending}>
          {pending ? "Envoi…" : "Recevoir le lien de connexion"}
        </button>
        {message && <Notice kind="succes">{message}</Notice>}
        {erreur && <Notice kind="erreur">{erreur}</Notice>}
      </form>
      </div>
      <div className="order-1 mx-auto max-w-xs md:order-2 md:max-w-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/gen/login.webp"
          alt="Une enveloppe scellée d'une étoile dorée"
          className="w-full"
        />
      </div>
    </div>
  );
}
