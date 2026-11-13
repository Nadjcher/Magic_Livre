/**
 * Atelier d'écriture (administrateur) : relire les histoires de test avec la
 * note de la directrice littéraire (IA), faire entrer les meilleures dans la
 * bibliothèque d'exemples (RAG), et gérer cette bibliothèque.
 * Seuls les livres des comptes administrateurs sont affichés (jamais ceux des clients).
 */

import type { Metadata } from "next";
import EpreuveRelectrice from "@/components/EpreuveRelectrice";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { listerExemples } from "@/lib/bibliotheque";
import {
  ajouterExempleAction,
  basculerExempleAction,
  supprimerExempleAction,
  validerHistoireAction,
  livrerVersionAction,
  relancerHistoireAction,
  livrerIllustrationsAction,
  relancerAttenteAction,
} from "@/app/actions/bibliotheque";
import { bookImageUrl } from "@/lib/bookImages";
import { EN_RELECTURE, EN_RELECTURE_IMAGES } from "@/lib/illustrationStatus";
import { lireFiches } from "@/lib/ficheEnfant";
import { budgetJour, depensesRecentes } from "@/lib/budget";

export const metadata: Metadata = { title: "Atelier d'écriture", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const TONS: [string, string][] = [
  ["tendre", "Tendre"],
  ["drole", "Drôle"],
  ["feerique", "Féerique"],
  ["aventure", "Aventure"],
  ["mystere", "Mystère"],
  ["comptine", "Comptine"],
];

const CRITERES: Record<string, string> = {
  voix_haute: "Voix haute",
  ritournelle: "Ritournelle",
  structure: "Structure",
  enfant_agit: "L'enfant agit",
  personnalisation: "Personnalisation",
  feerique: "Féerique",
  age: "Âge",
  fin: "Fin",
  rimes: "Rimes",
  chute_comprise: "Chute comprise",
};

/**
 * Données d'un mineur : dans la file de relecture, le prénom de l'enfant et ceux
 * de ses proches (fiche de l'enfant, et tout prénom après « mamie », « papa »,
 * « sa sœur »…) sont masqués.
 */
function masqueur(prenom: string, proches?: string): (texte: string) => string {
  const echapper = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const noms = new Set<string>([prenom]);
  for (const m of (proches ?? "").matchAll(/\p{Lu}[\p{L}'’-]+/gu)) noms.add(m[0]);
  const parente =
    /((?:mamie|mamy|papi|papy|grand-mère|grand-père|maman|papa|tonton|tata|tante|oncle|frère|sœur|soeur|cousin|cousine|parrain|marraine|nounou)\s+)\p{Lu}[\p{L}'’-]+/giu;
  return (texte) => {
    let t = texte.replace(parente, "$1[prénom]");
    for (const n of noms) t = t.replace(new RegExp(`(^|[^\\p{L}])${echapper(n)}(?=[^\\p{L}]|$)`, "gu"), n === prenom ? "$1[enfant]" : "$1[prénom]");
    return t;
  };
}

function CasesTons() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {TONS.map(([v, l]) => (
        <label key={v} className="flex items-center gap-1.5">
          <input type="checkbox" name="tons" value={v} /> {l}
        </label>
      ))}
    </div>
  );
}

export default async function AtelierPage() {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) notFound();

  const livres = await prisma.book.findMany({
    where: { userId: user.id, deletedAt: null, status: "ready" },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { id: true, title: true, pages: true, createdAt: true, child: { select: { firstName: true, age: true } } },
  });
  const exemples = await listerExemples();
  const depenses = await depensesRecentes();
  const { nombreEnAttente } = await import("@/lib/attenteIllustrations");
  const enAttente = await nombreEnAttente();
  // Images refaites par la relectrice d'images (30 derniers jours) : au-delà d'une sur trois, revoir les consignes.
  const [refaites] = await prisma.$queryRaw<{ livres: bigint; verifiees: number | null; refaites: number | null }[]>`
    SELECT COUNT(*) AS livres, SUM((pages->'controleImages'->>'verifiees')::int) AS verifiees,
           SUM((pages->'controleImages'->>'refaites')::int) AS refaites
    FROM "Book" WHERE pages->'controleImages' IS NOT NULL AND "createdAt" > NOW() - INTERVAL '30 days'`.catch(() => []);
  // File de relecture humaine : histoires refusées deux fois par la relectrice (tous comptes, anonymisées).
  const aRevoir = await prisma.$queryRaw<{ id: string; pages: unknown; prenom: string; age: number; childId: string; statut: string; err: string | null }[]>`
    SELECT b.id, b.pages, c."firstName" AS prenom, c.age, c.id AS "childId", b.status::text AS statut, b."errorMessage" AS err
    FROM "Book" b JOIN "Child" c ON c.id = b."childId"
    WHERE b."deletedAt" IS NULL AND (b.pages->'qualite'->>'aRevoir' = 'true' OR b."errorMessage" = ${EN_RELECTURE})
    ORDER BY (b."errorMessage" = ${EN_RELECTURE}) DESC, b."createdAt" DESC LIMIT 30`.catch(() => []);
  const fichesRevoir = await lireFiches(aRevoir.map((r) => r.childId));
  // Illustrations en relecture (une image refusée deux fois par la relectrice d'images).
  const imagesARelire = await prisma.book.findMany({
    where: { deletedAt: null, errorMessage: EN_RELECTURE_IMAGES },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true, title: true, pages: true },
  });
  // Note moyenne par trame (sur 40) : une trame sous 30 est à réécrire à la main.
  const parTrame = await prisma.$queryRaw<{ trame: string | null; moyenne: number; n: bigint }[]>`
    SELECT b.pages->'meta'->>'trame' AS trame, AVG((b.pages->'qualite'->>'total')::float) AS moyenne, COUNT(*) AS n
    FROM "Book" b WHERE b.pages->'qualite'->>'total' IS NOT NULL GROUP BY 1 ORDER BY 2`.catch(() => []);
  const titreTrame = new Map(exemples.map((e) => [e.id, e.titre]));

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl">Atelier d'écriture</h1>
        <p className="text-magique-texteClair">
          À chaque histoire, l'IA reçoit 2 extraits modèles et une trame tirés de la bibliothèque ci-dessous, choisis selon
          l'âge, le type de livre et le thème. Plus vous y ajoutez de bons textes, plus les histoires prennent votre ton.
        </p>
      </header>

      {enAttente > 0 && (
        <section className="carte space-y-3">
          <h2 className="text-2xl">Livres en file d'attente : {enAttente}</h2>
          <p className="text-sm text-magique-texteClair">
            Le compte fal était bloqué (crédit épuisé) : ces livres attendent leurs illustrations. Rechargez fal.ai, puis
            relancez-les. Ils repartent aussi seuls au prochain livre réussi, et chaque nuit.
          </p>
          <form action={relancerAttenteAction}>
            <button className="btn-primaire">Relancer les livres en attente</button>
          </form>
        </section>
      )}

      <section className="carte space-y-3">
        <h2 className="text-2xl">Jeu d'épreuve de la relectrice d'images</h2>
        <p className="text-sm text-magique-texteClair">
          Dix images aux défauts connus (doudou en chat, Poucet trop grand, parent dessiné en enfant, chemin pavé…), à refuser pour
          la bonne raison, et des images réussies, à accepter. À lancer seulement après une modification de la relectrice.
        </p>
        <EpreuveRelectrice />
      </section>

      <section className="carte space-y-2">
        <h2 className="text-2xl">Dépenses fal (estimation)</h2>
        <p className="text-sm text-magique-texteClair">
          Budget du jour : {budgetJour()} $. Au-delà, les créations gratuites s'arrêtent jusqu'au lendemain (achats et Club
          continuent). Le chiffre exact reste celui de votre tableau de bord fal.
        </p>
        {refaites && Number(refaites.livres) > 0 && (
          <p className="text-sm">
            Images refaites par la relectrice (30 jours) : <strong>{refaites.refaites ?? 0}</strong> sur {refaites.verifiees ?? 0} vérifiées, sur{" "}
            {Number(refaites.livres)} livre(s)
            {(refaites.verifiees ?? 0) > 0 && (refaites.refaites ?? 0) / (refaites.verifiees ?? 1) > 1 / 3 ? (
              <span className="text-rose-200"> : plus d'une sur trois, il faut revoir les consignes d'image.</span>
            ) : (
              "."
            )}
          </p>
        )}
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          {depenses.length === 0 && <li>Aucune dépense enregistrée.</li>}
          {depenses.map((d) => (
            <li key={d.jour} className={d.dollars >= budgetJour() ? "text-rose-200" : ""}>
              {d.jour} : <strong>{Number(d.dollars).toFixed(2)} $</strong> ({d.appels} appels)
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Vos dernières histoires</h2>
        <p className="text-sm text-magique-texteClair">
          Créez des livres avec votre compte, relisez-les ici, et faites entrer les meilleurs passages dans la bibliothèque
          (le prénom de l'enfant y est remplacé par « Nino »).
        </p>
        {livres.length === 0 && <p className="carte text-sm">Aucune histoire pour l'instant.</p>}
        {livres.map((l) => {
          const st = storySchema.safeParse(l.pages);
          if (!st.success) return null;
          const q = st.data.qualite;
          return (
            <details key={l.id} className="carte">
              <summary className="cursor-pointer py-1">
                <span className="font-serif text-lg">{l.title}</span>
                <span className="ml-2 text-sm text-magique-texteClair">
                  {l.child.firstName}, {l.child.age} ans ·{" "}
                  {q
                    ? q.total !== undefined
                      ? `${q.total}/${q.max ?? 40} ${q.accepte ? "acceptée" : "refusée"}${q.essais ? ` après ${q.essais} réécriture${q.essais > 1 ? "s" : ""}` : ""}`
                      : `note ${q.note}/10`
                    : "non notée"}
                </span>
              </summary>
              {q && (
                <div className="mt-3 space-y-2 rounded-xl bg-white/[0.05] p-3 text-sm">
                  <ul className="space-y-1">
                    {Object.entries(q.notes ?? {}).map(([k, v]) => (
                      <li key={k}>
                        {CRITERES[k] ?? k} : <strong>{v}/5</strong>
                        {q.justifications?.[k] && <span className="text-magique-texteClair"> — {q.justifications[k]}</span>}
                      </li>
                    ))}
                  </ul>
                  {q.problemes.length > 0 && (
                    <ul className="list-disc pl-5 text-magique-texteClair">
                      {q.problemes.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <ol className="mt-4 space-y-3">
                {st.data.pages.map((p, i) => (
                  <li key={i} className="whitespace-pre-line leading-relaxed">
                    <span className="mr-2 text-xs text-magique-texteClair">p. {i + 1}</span>
                    {p.texte}
                  </li>
                ))}
              </ol>
              <form action={validerHistoireAction} className="mt-5 space-y-3 border-t border-magique-trait pt-4">
                <input type="hidden" name="bookId" value={l.id} />
                <p className="font-semibold">Ajouter ce passage à la bibliothèque</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  Pages
                  <input name="de" type="number" min={1} max={st.data.pages.length} defaultValue={1} className="champ w-20" />
                  à
                  <input name="a" type="number" min={1} max={st.data.pages.length} defaultValue={Math.min(4, st.data.pages.length)} className="champ w-20" />
                </div>
                <CasesTons />
                <button className="btn-primaire">Ajouter à la bibliothèque</button>
              </form>
            </details>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">File de relecture ({aRevoir.length})</h2>
        <p className="text-sm text-magique-texteClair">
          En haut, les histoires non livrées (motif éliminatoire deux fois) : le parent attend sous 48 h. Ensuite, celles livrées
          juste sous le seuil après deux réécritures, pour améliorer la bible. Prénoms masqués ; une histoire quitte la file après 30 jours.
        </p>
        {aRevoir.map((r) => {
          const st = storySchema.safeParse(r.pages);
          if (!st.success) return null;
          const masquer = masqueur(r.prenom, fichesRevoir.get(r.childId)?.proches);
          const enAttente = r.err === EN_RELECTURE;
          return (
            <details key={r.id} className={`carte ${enAttente ? "border-or-clair" : ""}`}>
              <summary className="cursor-pointer py-1">
                {enAttente && <span className="mr-2 rounded-full bg-or-clair px-2 py-0.5 text-xs font-bold text-nuit">À livrer sous 48 h</span>}
                <span className="font-serif">{masquer(st.data.titre)}</span>
                <span className="ml-2 text-sm text-magique-texteClair">
                  {r.age} ans · {st.data.qualite?.total ?? "?"}/{st.data.qualite?.max ?? 40}{st.data.qualite?.eliminatoire ? " · éliminatoire" : ""}
                  {enAttente ? "" : " · déjà livrée au client"}
                </span>
              </summary>
              <ul className="mt-3 list-disc pl-5 text-sm text-magique-texteClair">
                {(st.data.qualite?.problemes ?? []).map((p) => (
                  <li key={p}>{masquer(p)}</li>
                ))}
              </ul>
              <ol className="mt-3 space-y-2">
                {st.data.pages.map((p, i) => (
                  <li key={i} className="whitespace-pre-line text-sm leading-relaxed">
                    <span className="mr-2 text-xs text-magique-texteClair">p. {i + 1}</span>
                    {masquer(p.texte)}
                  </li>
                ))}
              </ol>
              {enAttente && (
                <div className="mt-4 flex flex-wrap gap-3 border-t border-magique-trait pt-4">
                  <form action={livrerVersionAction}>
                    <input type="hidden" name="bookId" value={r.id} />
                    <button className="btn-primaire text-sm">Je l'ai relue : livrer cette version</button>
                  </form>
                  <form action={relancerHistoireAction}>
                    <input type="hidden" name="bookId" value={r.id} />
                    <button className="btn-secondaire text-sm">Relancer une nouvelle écriture</button>
                  </form>
                </div>
              )}
            </details>
          );
        })}
      </section>

      {imagesARelire.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl">Illustrations à relire ({imagesARelire.length})</h2>
          <p className="text-sm text-magique-texteClair">
            Une image a été refusée deux fois par la relectrice d'images : le livre attend votre regard (le parent a été prévenu, sous 48 h).
          </p>
          {imagesARelire.map((b) => {
            const st = storySchema.safeParse(b.pages);
            if (!st.success) return null;
            const signalees = st.data.imagesARevoir ?? [];
            return (
              <details key={b.id} className="carte border-or-clair">
                <summary className="cursor-pointer py-1">
                  <span className="mr-2 rounded-full bg-or-clair px-2 py-0.5 text-xs font-bold text-nuit">Sous 48 h</span>
                  {signalees.length} image(s) signalée(s) : {signalees.map((i) => (i === -1 ? "couverture" : `p. ${i + 1}`)).join(", ")}
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {signalees.map((i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={bookImageUrl(b.id, i === -1 ? "cover" : i, undefined, 480)} alt="" className="w-full rounded-xl" />
                  ))}
                </div>
                <form action={livrerIllustrationsAction} className="mt-4 flex flex-wrap items-center gap-3 border-t border-magique-trait pt-4">
                  <input type="hidden" name="bookId" value={b.id} />
                  <button className="btn-primaire text-sm">Je les ai regardées : livrer le livre</button>
                  <span className="text-xs text-magique-texteClair">Pour en refaire une, ouvrez le livre et utilisez « Redessiner cette illustration ».</span>
                </form>
              </details>
            );
          })}
        </section>
      )}

      {parTrame.length > 0 && (
        <section className="carte space-y-2">
          <h2 className="text-2xl">Note moyenne par trame</h2>
          <p className="text-sm text-magique-texteClair">Sur 40. Une trame sous 30 de moyenne est à réécrire à la main.</p>
          <ul className="space-y-1 text-sm">
            {parTrame.map((t) => (
              <li key={t.trame ?? "aucune"} className={t.moyenne < 30 ? "text-rose-200" : ""}>
                {t.trame ? titreTrame.get(t.trame) ?? t.trame : "Sans trame"} : <strong>{t.moyenne.toFixed(1)}</strong> ({Number(t.n)} histoire
                {Number(t.n) > 1 ? "s" : ""})
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="carte space-y-3">
        <h2 className="text-2xl">Écrire un modèle à la main</h2>
        <form action={ajouterExempleAction} className="space-y-3">
          <input name="titre" placeholder="Titre (ex. Le renard des nuages)" className="champ" required />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select name="type" className="champ w-auto">
              <option value="extrait">Extrait (modèle de ton)</option>
              <option value="trame">Trame (structure)</option>
            </select>
            De <input name="ageMin" type="number" min={1} max={12} defaultValue={3} className="champ w-20" /> à
            <input name="ageMax" type="number" min={1} max={12} defaultValue={8} className="champ w-20" /> ans
          </div>
          <CasesTons />
          <textarea
            name="texte"
            rows={8}
            placeholder="Le texte. Séparez les pages par une ligne vide."
            className="champ"
            required
            minLength={40}
          />
          <button className="btn-primaire">Ajouter</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">La bibliothèque ({exemples.filter((e) => e.actif).length} modèles actifs)</h2>
        {exemples.map((e) => (
          <details key={e.id} className={`carte ${e.actif ? "" : "opacity-50"}`}>
            <summary className="cursor-pointer py-1">
              <span className="font-semibold">{e.titre}</span>
              <span className="ml-2 text-sm text-magique-texteClair">
                {e.type === "trame" ? "Trame" : "Extrait"} · {e.ageMin}–{e.ageMax} ans · {e.tons.join(", ") || "tous tons"} ·{" "}
                {e.source === "depart" ? "départ" : e.source === "validee" ? "validée" : "écrite à la main"} · utilisé {e.utilisations} fois
              </span>
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{e.texte}</p>
            <div className="mt-3 flex gap-3">
              <form action={basculerExempleAction}>
                <input type="hidden" name="id" value={e.id} />
                <button className="btn-secondaire text-sm">{e.actif ? "Désactiver" : "Réactiver"}</button>
              </form>
              {e.source !== "depart" && (
                <form action={supprimerExempleAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="btn-secondaire text-sm">Supprimer</button>
                </form>
              )}
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
