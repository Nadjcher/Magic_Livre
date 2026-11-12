/**
 * Page publique d'un thème du catalogue (une page par thème, pour Google) :
 * présentation de l'histoire, ce qu'elle apporte, exemple, questions et lien
 * direct pour créer le livre.
 */

import { couvertureTheme } from "@/lib/couverturesThemes";
import { titreCouvertureTheme } from "@/lib/titrePrenom";
import Picto from "@/components/Picto";
import ApercuCouverture from "@/components/ApercuCouverture";
import CouvertureLivre, { prenomExemple } from "@/components/CouvertureLivre";
import { LIVRE_IMPRIME, formatEuros } from "@/lib/products";
import { env } from "@/lib/env";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { THEMES, THEME_CATEGORIES, findThemeById, reserveClub, themeOuvert } from "@/lib/themes";
import { getAppUrl } from "@/lib/appUrl";

export function generateStaticParams() {
  return THEMES.map((t) => ({ theme: t.id }));
}

export async function generateMetadata(props: { params: Promise<{ theme: string }> }): Promise<Metadata> {
  const params = await props.params;
  const t = findThemeById(params.theme);
  if (!t) return {};
  return {
    title: `Livre personnalisé « ${t.titre} » pour enfant`,
    description: `${t.accroche} Un livre illustré dont votre enfant est le héros, à son image et adapté à son âge. Lecture gratuite avant achat.`,
    alternates: { canonical: `/catalogue/${t.id}` },
  };
}

/** Le brief interne, reformulé pour le parent. */
function presentation(brief: string): string {
  return brief.replace(/^L'enfant/, "Votre enfant").replace(/\bl'enfant\b/g, "votre enfant");
}

const APPORTS: Record<string, string[]> = {
  fetes: ["Un souvenir unique pour un moment important", "Un cadeau qui se garde et se relit", "Toute la famille peut y apparaître"],
  grandir: ["Aide à préparer une grande étape", "Rassure en montrant l'enfant qui réussit", "Ouvre la discussion avec vous"],
  emotions: ["Met des mots sur ce qu'il ressent", "Montre une façon douce de surmonter la difficulté", "Idéal pour le rituel du soir"],
  aventures: ["Une histoire palpitante mais rassurante", "Votre enfant en héros courageux", "Donne le goût de la lecture"],
  passions: ["Part de ce qu'il aime déjà", "Nourrit sa curiosité", "Une histoire qu'il voudra relire"],
  classiques: ["Un conte que toute la famille connaît", "Votre enfant à la place du héros", "Une version douce, adaptée à son âge"],
};

export default async function ThemePage(props: { params: Promise<{ theme: string }> }) {
  const params = await props.params;
  const t = findThemeById(params.theme);
  if (!t) notFound();
  const categorie = THEME_CATEGORIES.find((c) => c.id === t.categorie);
  const voisins = THEMES.filter((x) => x.categorie === t.categorie && x.id !== t.id).slice(0, 3);
  const url = `${getAppUrl()}/catalogue/${t.id}`;
  const faq = [
    { q: "Comment le livre est-il personnalisé ?", r: "Vous indiquez le prénom et l'âge de votre enfant, et vous pouvez ajouter une photo : nous écrivons une histoire unique sur ce thème et nous dessinons un héros qui lui ressemble, le même à chaque page." },
    { q: "Pour quel âge ?", r: "De 1 à 12 ans : le type de livre, la longueur des phrases et le vocabulaire s'adaptent à l'âge exact de votre enfant." },
    { q: "Combien ça coûte ?", r: "La lecture à l'écran est gratuite. Vous payez seulement si vous voulez garder le livre : PDF à imprimer dès 6,99 €, sans abonnement." },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: getAppUrl() },
        { "@type": "ListItem", position: 2, name: "Catalogue", item: `${getAppUrl()}/catalogue` },
        { "@type": "ListItem", position: 3, name: t.titre, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.r } })),
    },
  ];

  return (
    <article className="mx-auto max-w-5xl space-y-12">
      <nav className="text-sm text-magique-texteClair" aria-label="Fil d'Ariane">
        <Link href="/catalogue" className="hover:underline">Catalogue</Link>
        {categorie && <span> › {categorie.label}</span>}
      </nav>

      <ApercuCouverture
        themeId={t.id}
        couverture={couvertureTheme(t.id)}
        titre={t.titre}
        titreCouverture={titreCouvertureTheme(t.id, t.titre)}
        prenomParDefaut={prenomExemple(t.id)}
        reserveClub={reserveClub(t)}
        bientot={!themeOuvert(t.id)}
      >
        <header className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {categorie && <span className="rounded-full bg-white/[0.08] px-3 py-1">{categorie.label}</span>}
            <span className="rounded-full bg-white/[0.08] px-3 py-1">De 1 à 12 ans</span>
            {t.saison && <span className="rounded-full bg-magique-rose/15 px-3 py-1 text-or-clair">De saison</span>}
            {!themeOuvert(t.id) ? (
              <span className="rounded-full bg-white/[0.08] px-3 py-1">Bientôt</span>
            ) : (
              reserveClub(t) && <span className="rounded-full bg-or/15 px-3 py-1 text-or">Réservé au Club</span>
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl">{t.titre}</h1>
          <p className="text-lg text-magique-texteClair">{t.accroche}</p>
        </header>
        <ul className="space-y-2.5">
          {[
            "Votre enfant est le héros : son prénom, son visage, ceux qu'il aime",
            "Une histoire écrite pour son âge, jamais deux fois la même",
            "Toute l'histoire à lire gratuitement, couverture et premières pages illustrées",
            "Prêt en 3 minutes environ, à lire à l'écran ou à voix haute",
          ].map((x) => (
            <li key={x} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-magique-primaire/20 text-xs text-magique-primaire" aria-hidden="true">✓</span>
              <span>{x}</span>
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border border-magique-trait text-center text-sm">
          <div className="p-3">
            <dt className="text-magique-texteClair">À l'écran</dt>
            <dd className="mt-1 font-serif text-lg font-semibold">Gratuit</dd>
          </div>
          <div className="border-x border-magique-trait p-3">
            <dt className="text-magique-texteClair">PDF à imprimer</dt>
            <dd className="mt-1 font-serif text-lg font-semibold">{formatEuros(env.bookPriceCents())}</dd>
          </div>
          <div className="p-3">
            <dt className="text-magique-texteClair">Livre relié</dt>
            <dd className="mt-1 font-serif text-lg font-semibold">{formatEuros(LIVRE_IMPRIME.priceCents)}</dd>
          </div>
        </dl>
      </ApercuCouverture>

      <section className="carte space-y-3">
        <h2 className="text-2xl">L'histoire</h2>
        <p className="leading-relaxed">{presentation(t.brief)}</p>
        <p className="leading-relaxed text-magique-texteClair">
          Chaque livre est écrit pour votre enfant : son prénom, son âge, et si vous le souhaitez son
          frère, sa sœur, ses parents ou son doudou. Deux enfants n'auront jamais la même histoire.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {(APPORTS[t.categorie] ?? APPORTS.aventures!).map((a) => (
          <div key={a} className="carte text-center text-sm font-semibold">✦ {a}</div>
        ))}
      </section>

      <section className="grid items-center gap-6 sm:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/exemple/noel/01.webp" alt="Exemple de page illustrée d'un livre Encore une histoire" loading="lazy" width={1024} height={576} className="h-auto w-full rounded-2xl shadow-conte" />
        <div className="space-y-2">
          <h2 className="text-2xl">À son image, à chaque page</h2>
          <p className="text-magique-texteClair">
            Ajoutez une photo : nous dessinons un héros qui lui ressemble vraiment, dans le style de
            votre choix (aquarelle, animation 3D, BD, manga…). La photo n'est jamais conservée.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Questions fréquentes</h2>
        {faq.map((f) => (
          <details key={f.q} className="carte">
            <summary className="cursor-pointer py-2 font-semibold">{f.q}</summary>
            <p className="mt-2 text-magique-texteClair">{f.r}</p>
          </details>
        ))}
      </section>

      {voisins.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl">Dans la même famille</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {voisins.map((v) => (
              <Link key={v.id} href={`/catalogue/${v.id}`} className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3 transition hover:bg-white/[0.09]">
                {couvertureTheme(v.id) ? (
                  <CouvertureLivre src={couvertureTheme(v.id)} prenom={prenomExemple(v.id)} compact className="w-16 flex-none" />
                ) : (
                  <Picto cle={`themes/${v.id}`} secours={v.emoji} taille={48} />
                )}
                <span className="font-semibold">{v.titre}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}
