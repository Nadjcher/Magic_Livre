/**
 * Atelier des planches : chaque histoire toute prête est dessinée une fois
 * (enfant et doudou neutres), validée ici, puis seuls l'enfant et le doudou
 * sont retouchés pour chaque livre.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { HISTOIRES_MAITRESSES } from "@/lib/histoiresMaitresses";
import { derniersLivres, etatPlanches, statsRefaites } from "@/lib/planches";
import { STYLE_DEFAUT } from "@/lib/style_config";
import { dessinerPlanchesAction, redessinerPlancheAction, revenirAncienneAction, utiliserCandidateAction, validerPlancheAction } from "@/app/actions/planches";

export const metadata: Metadata = { title: "Planches", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
// Le dessin des planches tourne en arrière-plan depuis cette page (jusqu'à 5 minutes).
export const maxDuration = 300;

export default async function PlanchesPage() {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) notFound();
  const style = STYLE_DEFAUT;
  const histoires = await Promise.all(
    HISTOIRES_MAITRESSES.map(async (h) => ({ h, etat: await etatPlanches(h, style), stats: await statsRefaites(h.id, style), livres: await derniersLivres(h.id) })),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl">Planches des histoires</h1>
        <p className="text-magique-texteClair">
          Chaque page est dessinée une seule fois, avec un enfant et un doudou « neutres ». Une fois toutes les planches
          validées, chaque livre ne retouche plus que l'enfant et son doudou (environ 0,05 $ par page). Tant qu'il manque une
          planche validée, les livres de cette histoire sont dessinés comme avant.
        </p>
      </header>

      {histoires.map(({ h, etat, stats, livres }) => (
        <section key={h.id} className="carte space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl">{h.titre.replace(" {de_prenom}", "")}</h2>
              <p className="text-sm text-magique-texteClair">
                {etat.dessinees}/{etat.total} dessinées · {etat.validees}/{etat.total} validées
                {etat.validees === etat.total ? " · prêtes : les livres utilisent les planches" : ""}
                {stats.livres > 0 ? ` · ${stats.livres} livre${stats.livres > 1 ? "s" : ""} fait${stats.livres > 1 ? "s" : ""} avec ces planches` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {etat.dessinees < etat.total && (
                <form action={dessinerPlanchesAction}>
                  <input type="hidden" name="histoire" value={h.id} />
                  <input type="hidden" name="style" value={style} />
                  <button className="btn-primaire">
                    Dessiner les {etat.total - etat.dessinees} planches manquantes (~{((etat.total - etat.dessinees) * 0.05 + 0.15).toFixed(2)} $)
                  </button>
                </form>
              )}
              {etat.dessinees === etat.total && etat.validees < etat.total && (
                <form action={validerPlancheAction}>
                  <input type="hidden" name="histoire" value={h.id} />
                  <input type="hidden" name="style" value={style} />
                  <input type="hidden" name="cle" value="*" />
                  <button className="btn-secondaire">Tout valider</button>
                </form>
              )}
            </div>
          </div>
          <p className="text-xs text-magique-texteClair">
            Une planche refaite par plus de 20 % des parents s'affiche en rouge : c'est elle qu'il faut redessiner. Le dessin se fait en arrière-plan (3 à 5 minutes) : rechargez la page. S'il en manque encore, relancez.
          </p>
          {etat.planches
            .filter((p) => p.candidat)
            .map((p) => (
              <div key={`cand-${p.cle}`} className="space-y-3 rounded-2xl border-2 border-or-clair p-4">
                <h3 className="text-xl">
                  Candidate pour {p.index === -1 ? "la couverture" : `la page ${p.index + 1}`}
                  {p.variante ? ` (parent ${p.variante})` : ""}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <figure className="space-y-1">
                    <figcaption className="text-sm text-magique-texteClair">En service aujourd'hui ({p.deDosEffectif ? "enfant de dos" : "enfant de face"})</figcaption>
                    {p.url ? <img src={`/api/admin/planche?h=${encodeURIComponent(h.id)}&s=${style}&c=${encodeURIComponent(p.cle)}`} alt="Planche en service" className="w-full rounded-lg" /> : null}
                  </figure>
                  <figure className="space-y-1">
                    <figcaption className="text-sm text-magique-texteClair">Candidate</figcaption>
                    <img src={`/api/admin/planche?h=${encodeURIComponent(h.id)}&s=${style}&c=${encodeURIComponent(`${p.cle}:candidat`)}`} alt="Planche candidate" className="w-full rounded-lg" />
                  </figure>
                </div>
                <form action={utiliserCandidateAction} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="histoire" value={h.id} />
                  <input type="hidden" name="style" value={style} />
                  <input type="hidden" name="cle" value={p.cle} />
                  <label className="text-sm">
                    Sur la candidate, l'enfant est vu{" "}
                    <select name="sens" defaultValue="face" className="champ inline-block w-auto">
                      <option value="face">de face</option>
                      <option value="dos">de dos</option>
                    </select>
                  </label>
                  <button className="btn-primaire">Utiliser cette candidate</button>
                </form>
                <p className="text-xs text-magique-texteClair">
                  L'échange se fait en une seule fois, déjà validé : aucun livre ne retombe sur l'ancien dessin. L'ancienne planche est gardée de côté.
                </p>
              </div>
            ))}
          {etat.planches
            .filter((p) => p.ancienne)
            .map((p) => (
              <form key={`anc-${p.cle}`} action={revenirAncienneAction} className="flex flex-wrap items-center gap-3 text-sm">
                <input type="hidden" name="histoire" value={h.id} />
                <input type="hidden" name="style" value={style} />
                <input type="hidden" name="cle" value={p.cle} />
                <span>Ancienne planche gardée pour {p.index === -1 ? "la couverture" : `la page ${p.index + 1}`}.</span>
                <button className="rounded-full border border-magique-trait px-3 py-1 text-xs">Revenir à l'ancienne</button>
              </form>
            ))}
          {livres.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer">Livres faits avec ces planches (48 dernières heures) : {livres.length}</summary>
              <ul className="mt-2 space-y-1 text-magique-texteClair">
                {livres.map((l) => (
                  <li key={l.id}>
                    {new Date(l.creeLe).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} · {l.status} · {l.id}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {etat.planches.map((p) => (
              <figure key={p.cle} className={`space-y-2 rounded-xl p-2 ${p.valide ? "bg-emerald-900/30" : "bg-white/[0.05]"}`}>
                {p.url ? (
                  <img
                    src={`/api/admin/planche?h=${encodeURIComponent(h.id)}&s=${style}&c=${encodeURIComponent(p.cle)}`}
                    alt={p.cle}
                    className="aspect-square w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-white/[0.04] text-sm text-magique-texteClair">
                    pas encore dessinée
                  </div>
                )}
                <figcaption className="text-xs">
                  <strong>{p.index === -1 ? "Couverture" : `Page ${p.index + 1}`}</strong>
                  {p.variante ? ` · parent ${p.variante}` : ""}
                  {!p.enfant && !p.doudou ? " · reprise telle quelle" : ""}
                  {stats.parCle.get(p.cle) ? (
                    <span className={`block ${stats.livres && (stats.parCle.get(p.cle) ?? 0) / stats.livres >= 0.2 ? "text-rose-300" : "text-magique-texteClair"}`}>
                      Refaite par les parents : {stats.parCle.get(p.cle)} livre{(stats.parCle.get(p.cle) ?? 0) > 1 ? "s" : ""}
                      {stats.livres ? ` (${Math.round(((stats.parCle.get(p.cle) ?? 0) / stats.livres) * 100)} %)` : ""}
                    </span>
                  ) : null}
                </figcaption>
                {p.url && (
                  <div className="flex gap-2">
                    <form action={validerPlancheAction}>
                      <input type="hidden" name="histoire" value={h.id} />
                      <input type="hidden" name="style" value={style} />
                      <input type="hidden" name="cle" value={p.cle} />
                      <input type="hidden" name="valide" value={p.valide ? "non" : "oui"} />
                      <button className="rounded-full border border-magique-trait px-3 py-1 text-xs">{p.valide ? "✓ Validée" : "Valider"}</button>
                    </form>
                    <form action={redessinerPlancheAction}>
                      <input type="hidden" name="histoire" value={h.id} />
                      <input type="hidden" name="style" value={style} />
                      <input type="hidden" name="cle" value={p.cle} />
                      <button className="rounded-full border border-magique-trait px-3 py-1 text-xs">Redessiner</button>
                    </form>
                  </div>
                )}
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
