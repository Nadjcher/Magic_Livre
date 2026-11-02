/**
 * Page publique d'un thème du catalogue (une page par thème, pour Google) :
 * présentation de l'histoire, ce qu'elle apporte, exemple, questions et lien
 * direct pour créer le livre.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { THEMES, THEME_CATEGORIES, findThemeById } from "@/lib/themes";
import { getAppUrl } from "@/lib/appUrl";

export function generateStaticParams() {
  return THEMES.map((t) => ({ theme: t.id }));
}

export function generateMetadata({ params }: { params: { theme: string } }): Metadata {
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
};

export default function ThemePage({ params }: { params: { theme: string } }) {
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
    <article className="mx-auto max-w-3xl space-y-10">
      <nav className="text-sm text-magique-texteClair" aria-label="Fil d'Ariane">
        <Link href="/catalogue" className="hover:underline">Catalogue</Link>
        {categorie && <span> › {categorie.label}</span>}
      </nav>

      <header className="space-y-4 text-center">
        <p className="text-5xl" aria-hidden="true">{t.emoji}</p>
        <h1 className="text-3xl sm:text-5xl">{t.titre}</h1>
        <p className="mx-auto max-w-[48ch] text-lg text-magique-texteClair">{t.accroche}</p>
        <Link href={`/creer?theme=${t.id}`} className="btn-primaire text-lg">
          Créer ce livre pour mon enfant
        </Link>
        <p className="text-sm text-magique-texteClair">Lecture gratuite · Prêt en 3 minutes · Sans abonnement</p>
      </header>

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
        <img src="/exemple/page-pont.webp" alt="Exemple de page illustrée d'un livre Storilou" loading="lazy" className="w-full rounded-2xl shadow-conte" />
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
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <p className="mt-2 text-magique-texteClair">{f.r}</p>
          </details>
        ))}
      </section>

      {voisins.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl">Dans la même famille</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {voisins.map((v) => (
              <Link key={v.id} href={`/catalogue/${v.id}`} className="carte carte-interactive">
                <span aria-hidden="true">{v.emoji}</span> <span className="font-semibold">{v.titre}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
