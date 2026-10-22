"use client";

/**
 * Formulaire de consentement parental. Case à cocher explicite et obligatoire.
 */

import { useState, useTransition } from "react";
import { recordConsent } from "@/app/actions/consent";
import { useRouter } from "next/navigation";
import Notice from "./Notice";

export default function ConsentForm({ termsVersion }: { termsVersion: string }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="carte space-y-4"
      action={(formData) =>
        startTransition(async () => {
          setErreur(null);
          const res = await recordConsent(formData);
          if (res.ok) {
            router.refresh();
          } else {
            setErreur(res.message);
          }
        })
      }
    >
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" value="on" className="mt-1 h-5 w-5" required />
        <span>
          Je suis le parent ou le représentant légal de cet enfant et j'accepte
          les{" "}
          <a href="/cgu" className="text-magique-primaire underline">
            conditions générales d'utilisation
          </a>{" "}
          ainsi que la{" "}
          <a href="/confidentialite" className="text-magique-primaire underline">
            politique de confidentialité
          </a>
          .
        </span>
      </label>
      <p className="text-xs text-magique-texteClair">
        Version des CGU : {termsVersion}. Votre consentement est enregistré avec
        la date et cette version.
      </p>
      <button type="submit" className="btn-primaire" disabled={pending}>
        {pending ? "Enregistrement…" : "Je donne mon consentement"}
      </button>
      {erreur && <Notice kind="erreur">{erreur}</Notice>}
    </form>
  );
}
