"use client";

/**
 * Page de connexion par lien magique (email). Aucun mot de passe.
 */

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import Notice from "@/components/Notice";

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
        const res = await signIn("nodemailer", { email, redirect: false });
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
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold text-magique-primaire">Connexion</h1>
      <p className="mt-2 text-magique-texteClair">
        Saisissez votre adresse email. Vous recevrez un lien de connexion
        sécurisé, sans mot de passe.
      </p>

      <form onSubmit={handleSubmit} className="carte mt-6 space-y-4">
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
  );
}
