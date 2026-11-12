/**
 * Catalogue public des histoires : tous les thèmes, par famille, avec un lien
 * direct pour créer le livre. Page publique (prospects, référencement).
 */

import { couvertureTheme } from "@/lib/couverturesThemes";
import { titreCouvertureTheme } from "@/lib/titrePrenom";
import CouvertureLivre, { prenomExemple } from "@/components/CouvertureLivre";
import Picto from "@/components/Picto";
import Link from "next/link";
import type { Metadata } from "next";
import { THEMES, THEME_CATEGORIES, reserveClub, themeOuvert } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Catalogue des histoires personnalisées",
  description:
    "Noël, premier jour d'école, petit frère, peur du noir, dinosaures, licornes… Choisissez le thème " +
    "et créez un livre illustré dont votre enfant est le héros.",
  alternates: { canonical: "/catalogue" },
};

export default function CataloguePage() {
  const saison = THEMES.filter((t) => t.saison);
  // Les grands classiques (réservés au Club) viennent en dernier, clairement signalés.
  const categories = [...THEME_CATEGORIES.filter((c) => c.id !== "classiques"), ...THEME_CATEGORIES.filter((c) => c.id === "classiques")];

  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="text-3xl sm:text-5xl">Le catalogue des histoires</h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-lg text-magique-texteClair">
          Choisissez un thème : nous écrivons et illustrons une histoire unique, dont votre enfant
          est le héros. Lecture gratuite à l'écran avant tout achat.
        </p>
      </header>

      <nav className="sans-barre -mx-4 flex gap-2 overflow-x-auto px-4 sm:flex-wrap sm:justify-center" aria-label="Catégories">
        {categories.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="flex min-h-11 flex-none items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold transition hover:border-white">
            <Picto cle={`categories/${c.id}`} secours={c.emoji} taille={24} />
            {c.label}
          </a>
        ))}
      </nav>

      {saison.map((t) => (
        <section
          key={t.id}
          className="relative overflow-hidden rounded-[2rem] px-6 py-8 text-white shadow-conte sm:px-10"
          style={{
            backgroundImage:
              "linear-gradient(160deg,#16245c,#0f1a44)",
          }}
        >
          <p className="font-serif italic text-magique-texteClair">De saison</p>
          {couvertureTheme(t.id) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={couvertureTheme(t.id)!} alt="" className="float-right ml-6 hidden aspect-[3/4] w-48 rounded-l-[4px] rounded-r-xl object-cover shadow-conte sm:block" />
          )}
          <h2 className="mt-1 text-3xl text-white sm:text-4xl">{t.titre}</h2>
          <p className="mt-3 max-w-[48ch] text-magique-texteClair">{t.accroche}</p>
          {themeOuvert(t.id) ? (
            <Link href={`/creer?theme=${t.id}`} rel="nofollow" className="btn-primaire mt-6">
              Créer ce livre
            </Link>
          ) : (
            <p className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">Bientôt disponible</p>
          )}
        </section>
      ))}

      {categories.map((c) => {
        // Les histoires disponibles d'abord ; les autres sont annoncées « Bientôt ».
        const themes = [...THEMES.filter((t) => t.categorie === c.id && themeOuvert(t.id)), ...THEMES.filter((t) => t.categorie === c.id && !themeOuvert(t.id))];
        return (
          <section key={c.id} id={c.id} className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl">
              <Picto cle={`categories/${c.id}`} secours={c.emoji} taille={40} className="mr-2 inline-block align-middle" />
              {c.label}
            </h2>
            {c.id === "classiques" && THEMES.some((t) => t.categorie === "classiques" && themeOuvert(t.id) && reserveClub(t)) && (
              <p className="mt-2 text-magique-texteClair">
                Réservés aux membres du <Link href="/club" className="font-semibold text-magique-primaire underline-offset-4 hover:underline">Club</Link> : les contes que vous connaissez par cœur, réécrits avec votre enfant en héros.
              </p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {themes.map((t) => (
                <article key={t.id} className={`group relative flex flex-col ${themeOuvert(t.id) ? "" : "opacity-55"}`}>
                  <CouvertureLivre src={couvertureTheme(t.id)} prenom={prenomExemple(t.id)} titre={titreCouvertureTheme(t.id, t.titre)} className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1.5" />
                  <h3 className="mt-3 text-[15px] font-semibold leading-snug sm:text-base">
                    <Link href={`/catalogue/${t.id}`} className="after:absolute after:inset-0 hover:underline">{t.titre}</Link>
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-magique-texteClair">
                    {t.accroche}
                  </p>
                  {themeOuvert(t.id) ? (
                    <Link
                      href={reserveClub(t) ? "/club" : `/creer?theme=${t.id}`} rel={reserveClub(t) ? undefined : "nofollow"}
                      className="relative z-10 mt-2 inline-flex min-h-11 w-fit items-center text-sm font-semibold text-magique-primaire hover:underline"
                    >
                      {reserveClub(t) ? "Avec le Club →" : "Créer ce livre →"}
                    </Link>
                  ) : (
                    <span className="mt-2 inline-flex min-h-11 w-fit items-center text-sm font-semibold text-magique-texteClair">Bientôt</span>
                  )}
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
