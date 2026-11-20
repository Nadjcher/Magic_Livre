/**
 * Atelier des personnages « maison » : chaque animal ou créature fréquent des
 * idées libres est dessiné une fois, puis validé en le regardant en grand.
 * Seuls les personnages validés servent aux livres.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { HISTOIRE_MAISON, etatMaison } from "@/lib/personnagesMaison";
import { STYLE_DEFAUT } from "@/lib/style_config";
import { dessinerMaisonAction, redessinerMaisonAction, validerMaisonAction } from "@/app/actions/personnages";

export const metadata: Metadata = { title: "Personnages maison", robots: { index: false } };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function PersonnagesPage() {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) notFound();
  const style = STYLE_DEFAUT;
  const etat = await etatMaison(style);
  const manquants = etat.total - etat.dessines;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl">Personnages maison</h1>
        <p className="text-magique-texteClair">
          Quand une idée libre a besoin d'un dragon, d'une fée ou d'un renard, elle prend le personnage validé ici au lieu d'en
          inventer un nouveau : son dessin est déjà sûr. Regardez chaque fiche en grand avant de la valider (une seule espèce
          reconnaissable, pas de texte, rien d'effrayant). Style : {style}.
        </p>
        <p className="text-sm text-magique-texteClair">
          {etat.dessines}/{etat.total} dessinés · {etat.valides}/{etat.total} validés (seuls les validés servent aux livres)
        </p>
        {manquants > 0 && (
          <form action={dessinerMaisonAction}>
            <button className="btn-primaire">
              Dessiner les {manquants} personnages manquants (~{(manquants * 0.05).toFixed(2)} $)
            </button>
            <p className="mt-2 text-xs text-magique-texteClair">Le dessin se fait en arrière-plan (3 à 5 minutes) : rechargez la page. S'il en manque encore, relancez.</p>
          </form>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {etat.liste.map((p) => (
          <figure key={p.id} className={`space-y-2 rounded-xl p-2 ${p.valide ? "bg-emerald-900/30" : "bg-white/[0.05]"}`}>
            {p.url ? (
              <a href={`/api/admin/planche?h=${HISTOIRE_MAISON}&s=${style}&c=${p.id}`} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/admin/planche?h=${HISTOIRE_MAISON}&s=${style}&c=${p.id}`} alt={p.francais} className="aspect-square w-full rounded-lg object-cover" />
              </a>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-white/[0.04] text-sm text-magique-texteClair">pas encore dessiné</div>
            )}
            <figcaption className="text-xs">
              <strong className="capitalize">{p.id}</strong>
              <span className="block text-magique-texteClair">{p.francais}</span>
            </figcaption>
            {p.url && (
              <div className="flex flex-wrap gap-2">
                <form action={validerMaisonAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="valide" value={p.valide ? "non" : "oui"} />
                  <button className="rounded-full border border-magique-trait px-3 py-1 text-xs">{p.valide ? "✓ Validé" : "Valider"}</button>
                </form>
                <details className="text-xs">
                  <summary className="cursor-pointer list-none rounded-full border border-magique-trait px-3 py-1">Redessiner…</summary>
                  <form action={redessinerMaisonAction} className="mt-2 space-y-1">
                    <input type="hidden" name="id" value={p.id} />
                    <p className="text-magique-texteClair">La fiche est effacée tout de suite, puis redessinée (payant).</p>
                    <button className="rounded-full border border-rose-300 px-3 py-1 text-rose-300">Oui, effacer cette fiche</button>
                  </form>
                </details>
              </div>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
