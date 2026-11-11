/**
 * Atelier d'écriture (administrateur) : relire les histoires de test avec la
 * note de la directrice littéraire (IA), faire entrer les meilleures dans la
 * bibliothèque d'exemples (RAG), et gérer cette bibliothèque.
 * Seuls les livres des comptes administrateurs sont affichés (jamais ceux des clients).
 */

import type { Metadata } from "next";
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
} from "@/app/actions/bibliotheque";

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
};

/** Le prénom de l'enfant est masqué dans la file de relecture (données d'un mineur). */
function anonymiser(texte: string, prenom: string): string {
  const p = prenom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return texte.replace(new RegExp(`(^|[^\\p{L}])${p}(?=[^\\p{L}]|$)`, "gu"), "$1[prénom]");
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
  // File de relecture humaine : histoires refusées deux fois par la relectrice (tous comptes, anonymisées).
  const aRevoir = await prisma.$queryRaw<{ id: string; pages: unknown; prenom: string; age: number }[]>`
    SELECT b.id, b.pages, c."firstName" AS prenom, c.age FROM "Book" b JOIN "Child" c ON c.id = b."childId"
    WHERE b."deletedAt" IS NULL AND b.pages->'qualite'->>'aRevoir' = 'true'
    ORDER BY b."createdAt" DESC LIMIT 20`.catch(() => []);
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
                      ? `${q.total}/40 ${q.accepte ? "acceptée" : "refusée"}${q.essais ? ` après ${q.essais} réécriture${q.essais > 1 ? "s" : ""}` : ""}`
                      : `note ${q.note}/10`
                    : "non notée"}
                </span>
              </summary>
              {q && (
                <div className="mt-3 space-y-2 rounded-xl bg-white/[0.05] p-3 text-sm">
                  <p className="flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(q.notes ?? {}).map(([k, v]) => (
                      <span key={k}>
                        {CRITERES[k] ?? k} : <strong>{v}</strong>
                      </span>
                    ))}
                  </p>
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
          Histoires refusées deux fois par la relectrice (sous 32/40 ou motif éliminatoire). Le prénom de l'enfant est masqué.
        </p>
        {aRevoir.map((r) => {
          const st = storySchema.safeParse(r.pages);
          if (!st.success) return null;
          return (
            <details key={r.id} className="carte">
              <summary className="cursor-pointer py-1">
                <span className="font-serif">{anonymiser(st.data.titre, r.prenom)}</span>
                <span className="ml-2 text-sm text-magique-texteClair">{r.age} ans · {st.data.qualite?.total ?? "?"}/40</span>
              </summary>
              <ul className="mt-3 list-disc pl-5 text-sm text-magique-texteClair">
                {(st.data.qualite?.problemes ?? []).map((p) => (
                  <li key={p}>{anonymiser(p, r.prenom)}</li>
                ))}
              </ul>
              <ol className="mt-3 space-y-2">
                {st.data.pages.map((p, i) => (
                  <li key={i} className="whitespace-pre-line text-sm leading-relaxed">
                    <span className="mr-2 text-xs text-magique-texteClair">p. {i + 1}</span>
                    {anonymiser(p.texte, r.prenom)}
                  </li>
                ))}
              </ol>
            </details>
          );
        })}
      </section>

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
