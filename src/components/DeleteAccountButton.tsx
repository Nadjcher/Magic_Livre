"use client";

/**
 * Bouton de suppression du compte (RGPD). Supprime toutes les données
 * associées après double confirmation.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/app/actions/account";
import Notice from "./Notice";

export default function DeleteAccountButton() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <button
        className="btn-secondaire border-red-500 text-red-600 hover:bg-red-500"
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              "Supprimer votre compte supprimera définitivement tous vos enfants, livres et commandes. Continuer ?",
            )
          )
            return;
          startTransition(async () => {
            setErreur(null);
            const res = await deleteAccount();
            if (res.ok) {
              router.push("/");
              router.refresh();
            } else {
              setErreur(res.message);
            }
          });
        }}
      >
        {pending ? "Suppression…" : "Supprimer mon compte et mes données"}
      </button>
      {erreur && <Notice kind="erreur">{erreur}</Notice>}
    </div>
  );
}
