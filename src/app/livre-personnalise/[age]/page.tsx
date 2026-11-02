/**
 * Page publique « livre personnalisé pour enfant de X ans » (référencement) :
 * besoins de l'âge, types de livres et styles adaptés.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AGE_GROUPS, findAgeGroup } from "@/lib/ageGroups";
import { formatsPourAge } from "@/lib/bookFormats";
import { ILLUSTRATION_STYLES, stylesPourAge } from "@/lib/style_config";

export function generateStaticParams() {
  return AGE_GROUPS.map((g) => ({ age: g.slug }));
}

export function generateMetadata({ params }: { params: { age: string } }): Metadata {
  const g = findAgeGroup(params.age);
  if (!g) return {};
  return {
    title: `Livre personnalisé pour enfant de ${g.label}`,
    description: `Un livre illustré dont votre enfant de ${g.label} est le héros : histoire adaptée à son âge, héros à son image. Lecture gratuite avant achat.`,
    alternates: { canonical: `/livre-personnalise/${g.slug}` },
  };
}

export default function AgePage({ params }: { params: { age: string } }) {
  const g = findAgeGroup(params.age);
  if (!g) notFound();
  const formats = Array.from(
    new Map(
      Array.from({ length: g.ageMax - g.ageMin + 1 }, (_, k) => formatsPourAge(g.ageMin + k))
        .flat()
        .map((f) => [f.id, f]),
    ).values(),
  );
  const styles = stylesPourAge(g.ageType);

  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-5xl">Un livre personnalisé pour un enfant de {g.label}</h1>
        <p className="mx-auto max-w-[56ch] text-lg text-magique-texteClair">{g.intro}</p>
        <Link href="/creer" className="btn-primaire text-lg">Créer son livre</Link>
      </header>

      <section className="carte space-y-3">
        <h2 className="text-2xl">Ce dont il a besoin à cet âge</h2>
        <ul className="space-y-2">
          {g.besoins.map((b) => <li key={b}>✦ {b}</li>)}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Les livres conçus pour {g.label}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {formats.map((f) => (
            <div key={f.id} className="carte">
              <p className="text-2xl" aria-hidden="true">{f.emoji}</p>
              <h3 className="mt-1 text-lg">{f.label}</h3>
              <p className="text-sm text-magique-texteClair">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Les styles de dessin adaptés</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {styles.map((s) => (
            <figure key={s} className="overflow-hidden rounded-xl border border-white/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/styles/${s}.webp`} alt={`Style ${ILLUSTRATION_STYLES[s].label}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="p-2 text-xs font-semibold">{ILLUSTRATION_STYLES[s].label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Les autres âges</h2>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.filter((x) => x.slug !== g.slug).map((x) => (
            <Link key={x.slug} href={`/livre-personnalise/${x.slug}`} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white">
              {x.label}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
