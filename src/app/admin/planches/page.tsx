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
import { etatPlanches, statsRefaites } from "@/lib/planches";
import { STYLE_DEFAUT } from "@/lib/style_config";
import { dessinerPlanchesAction, redessinerPlancheAction, validerPlancheAction } from "@/app/actions/planches";

export const metadata: Metadata = { title: "Planches", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
// Le dessin des planches tourne en arrière-plan depuis cette page (jusqu'à 5 minutes).
export const maxDuration = 300;

export default async function PlanchesPage() {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) notFound();
  const style = STYLE_DEFAUT;
  const histoires = await Promise.all(
    HISTOIRES_MAITRESSES.map(async (h) => ({ h, etat: await etatPlanches(h, style), stats: await statsRefaites(h.id, style) })),
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

      {histoires.map(({ h, etat, stats }) => (
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
