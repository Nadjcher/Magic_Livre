"use client";

/**
 * Formulaire de choix d'un nouveau mot de passe (après clic sur le lien email).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Notice from "@/components/Notice";
import { resetPassword } from "@/app/actions/auth";

export default function ResetPasswordForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!email || !token) {
    return <Notice kind="erreur">Lien incomplet. Refaites une demande de réinitialisation.</Notice>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    startTransition(async () => {
      const form = new FormData();
      form.set("email", email);
      form.set("token", token);
      form.set("password", password);
      form.set("confirm", confirm);
      const res = await resetPassword(form);
      if (res.ok) {
        setOk(true);
        setTimeout(() => router.push("/connexion"), 1500);
      } else {
        setErreur(res.message);
      }
    });
  }

  if (ok) {
    return (
      <Notice kind="succes">
        Mot de passe mis à jour. Redirection vers la connexion…
      </Notice>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="carte-relief mt-6 space-y-4 p-6">
      <div>
        <label className="block text-sm font-semibold" htmlFor="password">
          Nouveau mot de passe <span className="font-normal text-magique-texteClair">(8 car. min.)</span>
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
          Confirmer
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
        {pending ? "Mise à jour…" : "Enregistrer le mot de passe"}
      </button>
      {erreur && <Notice kind="erreur">{erreur}</Notice>}
      <p className="pt-1 text-center text-sm text-magique-texteClair">
        <Link href="/mot-de-passe-oublie" className="font-semibold text-magique-primaire hover:underline">
          Refaire une demande
        </Link>
      </p>
    </form>
  );
}
