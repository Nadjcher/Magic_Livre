"use client";

/**
 * Formulaires de la page « Mon compte » : changement de mot de passe, renvoi
 * de l'email de confirmation et suppression du compte (avec mot de passe).
 */

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePassword, deleteAccount, resendVerification } from "@/app/actions/account";
import Notice from "./Notice";

type Etat = { kind: "succes" | "erreur"; text: string } | null;

export function ChangePasswordForm() {
  const [etat, setEtat] = useState<Etat>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      className="space-y-3"
      action={(fd) =>
        start(async () => {
          setEtat(null);
          const res = await changePassword(fd);
          if (res.ok) {
            ref.current?.reset();
            router.push("/connexion?motdepasse=modifie");
            router.refresh();
          } else {
            setEtat({ kind: "erreur", text: res.message });
          }
        })
      }
    >
      <label className="block text-sm font-semibold">
        Mot de passe actuel
        <input name="current" type="password" required autoComplete="current-password" className="champ mt-1" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Nouveau mot de passe
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="champ mt-1" />
        </label>
        <label className="block text-sm font-semibold">
          Confirmer
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="champ mt-1" />
        </label>
      </div>
      <p className="text-xs text-magique-texteClair">
        8 caractères minimum. Après la modification, tous vos appareils sont
        déconnectés par sécurité.
      </p>
      {etat && <Notice kind={etat.kind}>{etat.text}</Notice>}
      <button type="submit" className="btn-primaire" disabled={pending}>
        {pending ? "Modification…" : "Changer mon mot de passe"}
      </button>
    </form>
  );
}

export function ResendVerificationButton() {
  const [etat, setEtat] = useState<Etat>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-secondaire px-4 py-2 text-sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await resendVerification();
            setEtat({ kind: res.ok ? "succes" : "erreur", text: res.message });
          })
        }
      >
        {pending ? "Envoi…" : "Renvoyer l'email de confirmation"}
      </button>
      {etat && <Notice kind={etat.kind}>{etat.text}</Notice>}
    </div>
  );
}

export function DeleteAccountForm() {
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!ouvert) {
    return (
      <button
        type="button"
        className="btn-secondaire border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
        onClick={() => setOuvert(true)}
      >
        Supprimer mon compte et mes données
      </button>
    );
  }

  return (
    <form
      className="space-y-3"
      action={(fd) =>
        start(async () => {
          setErreur(null);
          const res = await deleteAccount(fd);
          if (res.ok) {
            router.push("/?compte=supprime");
            router.refresh();
          } else {
            setErreur(res.message);
          }
        })
      }
    >
      <Notice kind="erreur">
        Action définitive : vos enfants, livres et achats seront effacés et ne
        pourront pas être récupérés. Pensez à télécharger vos PDF avant.
      </Notice>
      <label className="block text-sm font-semibold">
        Tapez <strong>SUPPRIMER</strong> pour confirmer
        <input name="confirmation" required autoComplete="off" className="champ mt-1" />
      </label>
      <label className="block text-sm font-semibold">
        Votre mot de passe
        <input name="password" type="password" required autoComplete="current-password" className="champ mt-1" />
      </label>
      {erreur && <Notice kind="erreur">{erreur}</Notice>}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {pending ? "Suppression…" : "Supprimer définitivement"}
        </button>
        <button type="button" className="btn-secondaire" onClick={() => setOuvert(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
