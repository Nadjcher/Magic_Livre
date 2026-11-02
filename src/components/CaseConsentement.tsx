"use client";

/**
 * Case à cocher obligatoire avant un paiement : acceptation des CGV et, pour
 * un contenu numérique, demande d'accès immédiat avec renonciation expresse au
 * droit de rétractation (art. L221-28 13° du Code de la consommation). Pour le
 * livre imprimé personnalisé : rappel de l'exception (art. L221-28 3°).
 */

import Link from "next/link";

export default function CaseConsentement({
  coche,
  onChange,
  physique = false,
}: {
  coche: boolean;
  onChange: (v: boolean) => void;
  physique?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-magique-texteClair">
      <input
        type="checkbox"
        checked={coche}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-none accent-magique-primaire"
      />
      <span>
        J'accepte les{" "}
        <Link href="/cgv" target="_blank" className="underline">
          conditions générales de vente
        </Link>
        .{" "}
        {physique
          ? "Le livre étant fabriqué sur mesure pour mon enfant, je reconnais qu'il n'ouvre pas droit à rétractation."
          : "Je demande l'accès immédiat au contenu numérique et je renonce expressément à mon droit de rétractation dès le début du téléchargement."}
      </span>
    </label>
  );
}
