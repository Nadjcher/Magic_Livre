/**
 * « Mon Club » : l'espace des membres. Chaque mois, une SÉLECTION de livres est
 * proposée pour chaque enfant (4 ou 8 selon la formule) : un clic sur
 * « Recevoir » et le livre est écrit et illustré, avec le même héros.
 */

import Link from "next/link";
import { titreCouvertureTheme } from "@/lib/titrePrenom";
import CouvertureLivre from "./CouvertureLivre";
import { prisma } from "@/lib/prisma";
import type { Abonnement } from "@/lib/subscription";
import { THEMES, type Theme } from "@/lib/themes";
import { bookImageUrl } from "@/lib/bookImages";
import { nomMois, selectionDuMois } from "@/lib/selectionMois";
import LivreCouverture from "./LivreCouverture";
import Picto from "./Picto";
import ClubManager from "./ClubManager";
import LivrePropose from "./LivrePropose";
import { couvertureTheme } from "@/lib/couverturesThemes";
import { livresDemo } from "@/lib/demo";

const date = (d: Date | null) => d?.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) ?? "";

/** Couleur de jaquette par famille de thèmes. */
const JAQUETTE: Record<string, string> = {
  classiques: "linear-gradient(165deg,#5a3f9e,#231a5c)",
  fetes: "linear-gradient(165deg,#b0477e,#3a1d58)",
  grandir: "linear-gradient(165deg,#2f8a7d,#173a5c)",
  emotions: "linear-gradient(165deg,#c06a5a,#3d2252)",
  aventures: "linear-gradient(165deg,#3a6fd1,#16245c)",
  passions: "linear-gradient(165deg,#c38a2f,#3b2a55)",
};

/** Livre proposé, pas encore reçu : une jaquette dessinée. */
export function Jaquette({ theme, prenom }: { theme: Theme; prenom: string }) {
  const couv = couvertureTheme(theme.id);
  if (couv) {
    return (
      <CouvertureLivre src={couv} prenom={prenom} titre={titreCouvertureTheme(theme.id, theme.titre)} />
    );
  }
  return (
    <div
      className="relative flex aspect-[3/4] flex-col items-center overflow-hidden rounded-l-[4px] rounded-r-xl px-4 pb-4 pt-3 text-center shadow-conte"
      style={{ backgroundImage: JAQUETTE[theme.categorie] ?? JAQUETTE.aventures }}
    >
      <div className="absolute inset-y-0 left-0 w-3" style={{ background: "linear-gradient(90deg,rgba(0,0,0,.4),rgba(255,255,255,.1) 70%,rgba(0,0,0,.1))" }} aria-hidden="true" />
      <div className="absolute inset-3 rounded-r-lg border border-white/15" aria-hidden="true" />
      <div className="flex flex-1 items-center">
        <Picto cle={`themes/${theme.id}`} secours={theme.emoji} taille={120} className="drop-shadow-[0_10px_14px_rgba(0,0,0,.35)]" />
      </div>
      <p className="font-serif text-[15px] leading-snug text-white sm:text-base">{theme.titre}</p>
      <p className="mt-1 text-xs text-white/75">avec {prenom} en héros</p>
    </div>
  );
}

export default async function EspaceClub({ userId, ab, enfantId }: { userId: string; ab: Abonnement; enfantId?: string }) {
  const demo = await livresDemo(userId);
  const tous = await prisma.child.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, age: true, books: { where: { deletedAt: null }, select: { id: true } } },
  });
  // Les enfants « de démonstration » (tous leurs livres sont des démos) ne sont pas proposés.
  const enfants = tous.filter((e) => e.books.length === 0 || e.books.some((b) => !demo.has(b.id)));
  const enfant = enfants.find((e) => e.id === enfantId) ?? enfants[0];
  const debut = ab.periodStart ?? new Date(Date.now() - 30 * 86400_000);

  // Livres du Club reçus sur la période (tous enfants), pour le compteur et l'affichage.
  const commandes = await prisma.order.findMany({
    where: { userId, sku: "book", amount: 0, status: "paid", createdAt: { gte: debut }, book: { deletedAt: null, status: { not: "failed" } } },
    orderBy: { createdAt: "asc" },
    select: { book: { select: { id: true, title: true, theme: true, status: true, childId: true, child: { select: { firstName: true } } } } },
  });
  const recus = commandes.flatMap((c) => (c.book && !demo.has(c.book.id) ? [c.book] : []));
  const ids = recus.map((l) => l.id);
  const avecCouverture = new Set(
    ids.length
      ? (await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Book" WHERE id = ANY(${ids}) AND pages->>'couvertureUrl' IS NOT NULL`).map((r) => r.id)
      : [],
  );
  const restants = Math.max(0, ab.quota - recus.length);

  if (!enfant) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-4xl">Bienvenue dans {ab.label}</h1>
        <p className="text-magique-texteClair">Ajoutez d'abord votre enfant pour recevoir sa sélection de livres du mois.</p>
        <Link href="/enfants" className="btn-primaire">Ajouter mon enfant</Link>
      </div>
    );
  }

  const selection = selectionDuMois(enfant.age, ab.quota);
  const livreDe = (t: Theme) => recus.find((l) => l.childId === enfant.id && l.theme === t.titre);
  const recusSelection = selection.filter((p) => livreDe(p.theme)).length;
  const horsSelection = recus.filter((l) => !selection.some((p) => p.theme.titre === l.theme && l.childId === enfant.id));
  const autresClassiques = THEMES.filter((t) => t.categorie === "classiques" && !selection.some((p) => p.theme.id === t.id));

  return (
    <div className="space-y-14">
      {/* ─── La sélection du mois ─── */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-serif italic text-or-clair">{ab.label} · votre espace</p>
            <h1 className="mt-1 text-3xl sm:text-4xl">
              La sélection de {nomMois()} pour {enfant.firstName}
            </h1>
            <p className="mt-2 text-magique-texteClair">
              {ab.quota} livres choisis pour ses {enfant.age} ans · {recusSelection} reçu{recusSelection > 1 ? "s" : ""} ·{" "}
              {ab.cancelAtPeriodEnd ? `abonnement actif jusqu'au ${date(ab.periodEnd)}` : `nouvelle sélection le ${date(ab.periodEnd)}`}
            </p>
          </div>
        </div>

        {enfants.length > 1 && (
          <nav className="sans-barre -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Choisir l'enfant">
            {enfants.map((e) => (
              <Link
                key={e.id}
                href={`/club?enfant=${e.id}`}
                aria-current={e.id === enfant.id ? "page" : undefined}
                className={`flex min-h-11 flex-none items-center rounded-full border px-4 text-sm font-semibold transition ${
                  e.id === enfant.id ? "border-magique-primaire bg-magique-primaire text-nuit" : "border-white/20 hover:border-white"
                }`}
              >
                {e.firstName}, {e.age} ans
              </Link>
            ))}
          </nav>
        )}

        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6">
          {selection.map(({ theme }, i) => {
            const livre = livreDe(theme);
            return (
              <li key={theme.id} className="space-y-3">
                {livre ? (
                  <>
                    <LivreCouverture
                      href={`/bibliotheque/${livre.id}`}
                      titre={livre.status === "generating" ? theme.titre : livre.title}
                      enfant={livre.child.firstName}
                      couverture={avecCouverture.has(livre.id) ? bookImageUrl(livre.id, "cover", undefined, 480) : couvertureTheme(theme.id)}
                      statut={livre.status}
                      priorite={i < 4}
                    />
                    <Link href={`/bibliotheque/${livre.id}`} className="btn-secondaire w-full px-3 py-2 text-sm">
                      {livre.status === "generating" ? "En préparation…" : "Lire"}
                    </Link>
                  </>
                ) : (
                  <LivrePropose
                    titre={theme.titre}
                    accroche={theme.accroche}
                    prenom={enfant.firstName}
                    couverture={couvertureTheme(theme.id)}
                    childId={enfant.id}
                    themeId={theme.id}
                    desactive={restants <= 0}
                  >
                    <Jaquette theme={theme} prenom={enfant.firstName} />
                  </LivrePropose>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-magique-texteClair">
          {restants > 0
            ? `Il vous reste ${restants} livre${restants > 1 ? "s" : ""} ce mois-ci. Chaque livre est écrit et illustré en 2 à 3 minutes, avec le même héros que ses livres précédents.`
            : `Vous avez reçu tous vos livres du mois. La prochaine sélection arrive le ${date(ab.periodEnd)}.`}
        </p>
      </section>

      {/* ─── Livres créés librement ce mois-ci ─── */}
      {horsSelection.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-2xl sm:text-3xl">Vos autres livres du mois</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-6">
            {horsSelection.map((l) => (
              <li key={l.id}>
                <LivreCouverture
                  href={`/bibliotheque/${l.id}`}
                  titre={l.title}
                  enfant={l.child.firstName}
                  couverture={avecCouverture.has(l.id) ? bookImageUrl(l.id, "cover", undefined, 480) : null}
                  statut={l.status}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Envie d'autre chose ─── */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl">Envie d'une autre histoire ?</h2>
            <p className="mt-2 max-w-[60ch] text-magique-texteClair">
              Vous pouvez aussi choisir vous-même : elle compte dans vos {ab.quota} livres du mois.
            </p>
          </div>
          <Link href="/creer" className="inline-flex min-h-11 items-center font-semibold text-magique-primaire underline-offset-4 hover:underline">
            Créer une histoire sur mesure
          </Link>
        </div>
        <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-6">
          {autresClassiques.slice(0, 12).map((t) => (
            <li key={t.id}>
              <Link
                href={`/creer?theme=${t.id}`}
                className="group flex flex-col gap-2 text-sm font-semibold"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={couvertureTheme(t.id) ?? ""} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-l-[3px] rounded-r-lg object-cover shadow-conte transition-transform duration-200 group-hover:-translate-y-1" />
                <span className="leading-snug">{t.titre}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Abonnement ─── */}
      <section className="flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-sm text-magique-texteClair">
          <p>
            <strong className="text-magique-texte">{ab.label}</strong> · {ab.quota} livres par mois · sans engagement.
          </p>
          <p className="mt-1">Les livres reçus restent à vous, même si vous arrêtez.</p>
        </div>
        <ClubManager resilie={ab.cancelAtPeriodEnd} />
      </section>
    </div>
  );
}
