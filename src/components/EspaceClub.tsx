/**
 * « Mon Club » : l'espace des membres. Les livres du mois (faits et à faire),
 * les grands classiques à créer, les idées du moment et la gestion de l'abonnement.
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Abonnement } from "@/lib/subscription";
import { THEMES } from "@/lib/themes";
import { bookImageUrl } from "@/lib/bookImages";
import LivreCouverture from "./LivreCouverture";
import Picto from "./Picto";
import ClubManager from "./ClubManager";

const date = (d: Date | null) => d?.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) ?? "";

export default async function EspaceClub({ userId, ab }: { userId: string; ab: Abonnement }) {
  // Livres créés avec le Club sur la période en cours (commandes « book » à 0 €).
  const commandes = await prisma.order.findMany({
    where: {
      userId,
      sku: "book",
      amount: 0,
      status: "paid",
      createdAt: { gte: ab.periodStart ?? new Date(Date.now() - 30 * 86400_000) },
      book: { deletedAt: null, status: { not: "failed" } },
    },
    orderBy: { createdAt: "asc" },
    select: { book: { select: { id: true, title: true, status: true, child: { select: { firstName: true } } } } },
  });
  const livres = commandes.flatMap((c) => (c.book ? [c.book] : []));
  const ids = livres.map((l) => l.id);
  const avecCouverture = new Set(
    ids.length
      ? (
          await prisma.$queryRaw<{ id: string }[]>`
            SELECT id FROM "Book" WHERE id = ANY(${ids}) AND pages->>'couvertureUrl' IS NOT NULL`
        ).map((r) => r.id)
      : [],
  );
  const restants = Math.max(0, ab.quota - livres.length);
  const classiques = THEMES.filter((t) => t.categorie === "classiques");
  const idees = [...THEMES.filter((t) => t.saison), ...THEMES.filter((t) => !t.saison && t.categorie !== "classiques")].slice(0, 6);

  return (
    <div className="space-y-14">
      {/* ─── Les livres du mois ─── */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-serif italic text-or-clair">{ab.label} · votre espace</p>
            <h1 className="mt-1 text-3xl sm:text-4xl">
              {restants > 0
                ? `Encore ${restants} livre${restants > 1 ? "s" : ""} à créer ce mois-ci`
                : "Tous vos livres du mois sont créés"}
            </h1>
            <p className="mt-2 text-magique-texteClair">
              {ab.cancelAtPeriodEnd
                ? `Abonnement résilié : il reste actif jusqu'au ${date(ab.periodEnd)}.`
                : `${ab.quota} livres par mois. Nouveaux livres le ${date(ab.periodEnd)}.`}
              {ab.premium && " Illustrations haute qualité incluses."}
            </p>
          </div>
          {restants > 0 && (
            <Link href="/creer" className="btn-primaire">
              Créer un livre
            </Link>
          )}
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-6">
          {livres.map((l, i) => (
            <li key={l.id}>
              <LivreCouverture
                href={`/bibliotheque/${l.id}`}
                titre={l.title}
                enfant={l.child.firstName}
                couverture={avecCouverture.has(l.id) ? bookImageUrl(l.id, "cover") : null}
                statut={l.status}
                priorite={i < 4}
              />
            </li>
          ))}
          {Array.from({ length: restants }).map((_, i) => (
            <li key={`libre-${i}`}>
              <Link
                href="/creer"
                className="group flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-l-[4px] rounded-r-xl border-2 border-dashed border-white/25 text-center transition hover:border-magique-primaire hover:bg-white/[0.04]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 font-serif text-2xl text-white transition group-hover:bg-magique-primaire group-hover:text-nuit" aria-hidden="true">
                  +
                </span>
                <span className="px-3 text-sm font-semibold">Livre {livres.length + i + 1}</span>
                <span className="px-3 text-xs text-magique-texteClair">à créer</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Les grands classiques ─── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl sm:text-3xl">Les grands classiques, réservés au Club</h2>
          <p className="mt-2 max-w-[60ch] text-magique-texteClair">
            Les contes que vous connaissez par cœur, réécrits pour son âge, avec votre enfant en héros.
            {restants === 0 && ` Vos prochains livres arrivent le ${date(ab.periodEnd)}.`}
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {classiques.map((t) => (
            <li key={t.id}>
              <Link
                href={restants > 0 ? `/creer?theme=${t.id}` : `/catalogue/${t.id}`}
                className="group flex h-full flex-col items-center rounded-2xl bg-white/[0.05] p-4 text-center transition hover:bg-white/[0.09]"
              >
                <Picto cle={`themes/${t.id}`} secours={t.emoji} taille={80} className="transition duration-300 group-hover:-translate-y-1" />
                <p className="mt-2 font-serif text-[17px] leading-snug">{t.titre}</p>
                <p className="mt-1 text-xs leading-relaxed text-magique-texteClair">{t.accroche}</p>
                {restants > 0 && <span className="mt-auto pt-3 text-sm font-semibold text-magique-primaire">Créer ce livre →</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Idées du moment ─── */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl sm:text-3xl">Et aussi, en ce moment</h2>
          <Link href="/catalogue" className="font-semibold text-magique-primaire underline-offset-4 hover:underline">
            Tout le catalogue
          </Link>
        </div>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {idees.map((t) => (
            <li key={t.id}>
              <Link
                href={restants > 0 ? `/creer?theme=${t.id}` : `/catalogue/${t.id}`}
                className="group flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center text-sm font-semibold transition hover:bg-white/[0.07]"
              >
                <Picto cle={`themes/${t.id}`} secours={t.emoji} taille={60} className="transition duration-300 group-hover:-translate-y-1" />
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
          <p className="mt-1">Les livres créés restent à vous, même si vous arrêtez.</p>
        </div>
        <ClubManager resilie={ab.cancelAtPeriodEnd} />
      </section>
    </div>
  );
}
