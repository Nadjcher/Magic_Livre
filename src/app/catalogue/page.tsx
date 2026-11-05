/**
 * Catalogue public des histoires : tous les thèmes, par famille, avec un lien
 * direct pour créer le livre. Page publique (prospects, référencement).
 */

import Picto from "@/components/Picto";
import Link from "next/link";
import type { Metadata } from "next";
import { THEMES, THEME_CATEGORIES } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Catalogue des histoires personnalisées",
  description:
    "Noël, premier jour d'école, petit frère, peur du noir, dinosaures, licornes… Choisissez le thème " +
    "et créez un livre illustré dont votre enfant est le héros.",
  alternates: { canonical: "/catalogue" },
};

export default function CataloguePage() {
  const saison = THEMES.filter((t) => t.saison);

  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="text-3xl sm:text-5xl">Le catalogue des histoires</h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-lg text-magique-texteClair">
          Choisissez un thème : nous écrivons et illustrons une histoire unique, dont votre enfant
          est le héros. Lecture gratuite à l'écran avant tout achat.
        </p>
      </header>

      {saison.map((t) => (
        <section
          key={t.id}
          className="relative overflow-hidden rounded-[2rem] px-6 py-8 text-white shadow-conte sm:px-10"
          style={{
            backgroundImage:
              "linear-gradient(160deg,#16245c,#0f1a44)",
          }}
        >
          <p className="font-serif italic text-[#cdd7f4]">De saison</p>
          <h2 className="mt-1 text-3xl text-white sm:text-4xl">
            <Picto cle={`themes/${t.id}`} secours={t.emoji} taille={56} className="mr-2 inline-block align-middle" />
            {t.titre}
          </h2>
          <p className="mt-3 max-w-[48ch] text-[#cdd7f4]">{t.accroche}</p>
          <Link href={`/creer?theme=${t.id}`} className="btn-primaire mt-6">
            Créer ce livre
          </Link>
        </section>
      ))}

      {THEME_CATEGORIES.map((c) => {
        const themes = THEMES.filter((t) => t.categorie === c.id);
        return (
          <section key={c.id} id={c.id} className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl">
              <Picto cle={`categories/${c.id}`} secours={c.emoji} taille={40} className="mr-2 inline-block align-middle" />
              {c.label}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((t) => (
                <article key={t.id} className="relative flex flex-col rounded-2xl bg-white/[0.05] p-5 pl-24 transition hover:bg-white/[0.08]">
                  <Picto cle={`themes/${t.id}`} secours={t.emoji} taille={64} className="absolute left-5 top-5" />
                  <h3 className="text-lg">
                    <Link href={`/catalogue/${t.id}`} className="after:absolute after:inset-0 after:rounded-2xl hover:underline">{t.titre}</Link>
                  </h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-magique-texteClair">
                    {t.accroche}
                  </p>
                  <Link
                    href={`/creer?theme=${t.id}`}
                    className="relative z-10 mt-2 inline-flex min-h-11 w-fit items-center text-sm font-semibold text-magique-primaire hover:underline"
                  >
                    Créer ce livre →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="carte text-center">
        <h2 className="text-2xl">Une autre idée en tête ?</h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-magique-texteClair">
          Décrivez l'aventure de votre choix en quelques mots, nous l'écrivons pour votre enfant.
        </p>
        <Link href="/creer" className="btn-primaire mt-5">
          Écrire mon idée
        </Link>
      </section>
    </div>
  );
}
