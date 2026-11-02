"use client";

/** Choix de la formule Club et souscription (Stripe Checkout). */

import { useState, useTransition } from "react";
import Link from "next/link";
import { startClub } from "@/app/actions/club";
import { PLANS_CLUB, formatEuros, type PlanClub } from "@/lib/products";
import Notice from "./Notice";

export default function ClubPlans({ connecte, membre }: { connecte: boolean; membre: string | null }) {
  const [accord, setAccord] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [encours, setEncours] = useState<PlanClub | null>(null);
  const [pending, start] = useTransition();

  function choisir(plan: PlanClub) {
    start(async () => {
      setErreur(null);
      setEncours(plan);
      const r = await startClub(plan, accord);
      if (r.ok && r.url) window.location.href = r.url;
      else {
        setErreur(r.message);
        setEncours(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {(Object.keys(PLANS_CLUB) as PlanClub[]).map((k) => {
          const p = PLANS_CLUB[k];
          const vedette = k === "club";
          return (
            <div key={k} className={`relative flex flex-col rounded-3xl border-2 p-6 ${vedette ? "border-magique-primaire bg-white/[0.1] shadow-or" : "border-white/15 bg-white/[0.06]"}`}>
              {vedette && (
                <span className="absolute -top-3 left-6 rounded-full bg-magique-primaire px-3 py-1 text-xs font-bold text-white">Le plus choisi</span>
              )}
              <h2 className="text-2xl">{p.label}</h2>
              <p className="mt-2 font-serif text-4xl">
                {formatEuros(p.priceCents)}
                <span className="text-base text-magique-texteClair"> / mois</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
                {p.avantages.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="text-magique-primaire" aria-hidden="true">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
              {membre ? (
                <p className="mt-6 text-sm text-magique-texteClair">Vous êtes déjà membre du {membre}.</p>
              ) : connecte ? (
                <button type="button" className={`${vedette ? "btn-primaire" : "btn-secondaire"} mt-6`} disabled={pending || !accord} onClick={() => choisir(k)}>
                  {encours === k ? "Redirection…" : `Rejoindre ${p.label}`}
                </button>
              ) : (
                <Link href="/inscription?suite=/club" className={`${vedette ? "btn-primaire" : "btn-secondaire"} mt-6`}>
                  Créer mon compte
                </Link>
              )}
            </div>
          );
        })}
      </div>
      {connecte && !membre && (
        <label className="mx-auto flex max-w-2xl cursor-pointer items-start gap-2 text-xs leading-relaxed text-magique-texteClair">
          <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} className="mt-0.5 h-4 w-4 flex-none accent-magique-primaire" />
          <span>
            J'accepte les <Link href="/cgv" target="_blank" className="underline">conditions générales de vente</Link> et
            l'abonnement mensuel reconduit chaque mois, résiliable à tout moment depuis « Mon compte ». Je demande l'accès
            immédiat aux contenus et je renonce à mon droit de rétractation dès la création du premier livre.
          </span>
        </label>
      )}
      {erreur && <Notice kind="erreur">{erreur}</Notice>}
    </div>
  );
}
