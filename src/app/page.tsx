/**
 * Landing page Encore une histoire.
 *
 * Positionnement : une histoire écrite pour l'enfant (âge, thème), un héros à
 * son image, prête en quelques minutes, et lue gratuitement AVANT tout paiement.
 * Un seul élément fort (le livre en relief du héros), le reste sobre.
 */

import { couvertureTheme } from "@/lib/couverturesThemes";
import { titreCouvertureTheme } from "@/lib/titrePrenom";
import CouvertureLivre, { prenomExemple } from "@/components/CouvertureLivre";
import Link from "next/link";
import type { Metadata } from "next";
import { DELUXE_PRODUCTS, LIVRE_IMPRIME, PACK_TOUT, PLANS_CLUB } from "@/lib/products";
import AgeExplorer from "@/components/AgeExplorer";
import WaitlistForm from "@/components/WaitlistForm";
import { DATE_OUVERTURE, ventesOuvertes } from "@/lib/lancement";
import AvisListe, { Etoiles } from "@/components/AvisListe";
import { avisPublics } from "@/lib/reviews";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { getAppUrl } from "@/lib/appUrl";
import { findThemeById } from "@/lib/themes";
import Picto from "@/components/Picto";
import BoutonCollant from "@/components/BoutonCollant";
import { FONDATEUR } from "@/lib/fondateur";
import { ILLUSTRATION_STYLES, ILLUSTRATION_STYLE_KEYS } from "@/lib/style_config";

export const metadata: Metadata = {
  title: { absolute: "Livre personnalisé pour enfant, illustré à son image · Encore une histoire" },
  alternates: { canonical: "/" },
};

const APP_URL = getAppUrl();

function euros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

/** Illustration peinte de la marque (fichiers dans /public/illustrations/feerique). */
function Illu({ nom, alt, className = "" }: { nom: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/illustrations/feerique/${nom}.webp`} alt={alt} className={className} />;
}

function Coche() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 flex-none text-magique-primaire" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

const PROMESSES = [
  "Lu gratuitement avant tout achat",
  "Écrit pour son âge, de 1\u00A0à\u00A012\u00A0ans",
  "Sa photo n'est jamais conservée",
];


/** Notre livre face au livre personnalisé classique. */
const COMPARATIF: [string, string, string][] = [
                ["L'histoire", "La même pour tous, prénom inséré", "Inventée pour votre enfant, unique"],
                ["Le héros", "Un avatar à choisir dans une liste", "Dessiné d'après sa photo, le même à chaque page"],
                ["L'âge", "Un livre « 3-8 ans »", "Écrit pour son âge exact, de 1 à 12 ans"],
                ["La famille", "Rarement", "Frère, sœur, parents, doudou, animal"],
                ["Avant d'acheter", "Un aperçu de quelques pages", "Le livre entier, gratuitement"],
];

/** L'histoire d'un soir, en quatre images (même personnage que le livre de démonstration). */
const RECIT = [
  { img: "a_supplie", alt: "Léo au lit tend un vieux livre", texte: "« Encore une histoire, Maman ! » Il tend le même vieux livre, une fois de plus." },
  { img: "b_pile", alt: "Une pile de livres usés", texte: "Les mêmes livres, lus et relus. Il les connaît par cœur. Vous aussi." },
  { img: "c_cestmoi", alt: "Léo découvre qu'il est le héros du livre", texte: "Un soir, une photo… Le lendemain : « Maman… c'est MOI ? »" },
  { img: "d_dort", alt: "Léo endormi, son livre serré contre lui", texte: "Il s'est endormi en serrant son livre contre lui." },
];

const ETAPES = [
  {
    illu: "imagine",
    titre: "Choisissez un thème",
    texte: "Noël, premier jour d'école, dinosaures, peur du noir… ou votre propre idée.",
  },
  {
    illu: "write",
    titre: "Nous écrivons et illustrons",
    texte: "Une histoire adaptée à son âge, illustrée à son image, en quelques minutes.",
  },
  {
    illu: "together",
    titre: "Lisez-la ensemble",
    texte: "À l'écran ou à voix haute, blottis ensemble. Gardez-la en PDF si elle vous plaît.",
  },
];

const THEMES_VITRINE = [
  "chaperon-rouge",
  "haricot-magique",
  "noel",
  "rentree",
  "petit-frere",
  "peur-du-noir",
  "dinosaures",
  "licornes",
  "super-heros",
  "espace",
];

const KIT = [
  "Le livre en PDF à imprimer",
  "Cahier de coloriage",
  "Affiche du héros",
  "Carte d'invitation",
  "Planche d'autocollants",
  "Marque-pages",
];

const FAQ = [
  {
    q: "Que devient la photo de mon enfant ?",
    r: "Elle sert uniquement à dessiner le héros. Elle est envoyée de façon chiffrée à notre prestataire d'illustration (fal.ai) le temps du dessin, n'est jamais enregistrée chez nous et n'apparaît jamais dans le livre : il ne contient que des illustrations. La liste de nos prestataires est dans la politique de confidentialité.",
  },
  {
    q: "C'est vraiment gratuit ?",
    r: "Oui. Créer le livre et lire toute l'histoire à l'écran ne coûte rien : la couverture et les 3 premières pages sont illustrées. Vous payez seulement pour garder le livre entièrement illustré (PDF et kit), en une fois, sans abonnement.",
  },
  {
    q: "Combien de temps faut-il ?",
    r: "Quelques minutes après avoir validé (environ 3 minutes) : l'histoire et toutes les illustrations sont créées pendant ce temps.",
  },
  {
    q: "Pour quel âge ?",
    r: "De 1 à 12 ans, avec un type de livre pour chaque âge : imagier et comptine pour les tout-petits, album et cherche-et-trouve, grande aventure, enquête à résoudre et mini-roman en chapitres pour les plus grands.",
  },
  {
    q: "Puis-je imprimer le livre ?",
    r: "Oui : le PDF est au format A4, prêt à imprimer chez vous ou en reprographie. Le kit (coloriage, affiche, invitation…) aussi.",
  },
  {
    q: "Le paiement est-il sécurisé ?",
    r: "Le paiement passe par Stripe, par carte bancaire. Nous ne voyons jamais vos coordonnées bancaires.",
  },
];

export default async function AccueilPage() {
  const session = await auth();
  // Visiteur : on l'emmène créer son compte ; parent connecté : droit au studio.
  const cta = session?.user ? "/creer" : "/inscription";
  const prix = euros(env.bookPriceCents());
  const prixPremium = euros(env.bookPricePremiumCents());
  // Avis vérifiés (affichés et transmis à Google uniquement s'il y en a de vrais).
  const avis = await avisPublics(6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${APP_URL}/#organization`, name: "Encore une histoire", url: APP_URL, logo: `${APP_URL}/icon.svg` },
      { "@type": "WebSite", "@id": `${APP_URL}/#website`, url: APP_URL, name: "Encore une histoire", inLanguage: "fr-FR", publisher: { "@id": `${APP_URL}/#organization` } },
      {
        "@type": "Product",
        name: "Livre illustré personnalisé pour enfant",
        description:
          "Une histoire écrite pour votre enfant, adaptée à son âge et illustrée à son image, prête en quelques minutes. Lecture gratuite à l'écran, PDF à imprimer.",
        brand: { "@id": `${APP_URL}/#organization` },
        offers: {
          "@type": "Offer",
          price: (env.bookPriceCents() / 100).toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${APP_URL}/creer`,
        },
        ...(avis.total > 0
          ? {
              aggregateRating: { "@type": "AggregateRating", ratingValue: avis.moyenne, reviewCount: avis.total, bestRating: 5, worstRating: 1 },
              review: avis.avis.slice(0, 5).map((a) => ({
                "@type": "Review",
                reviewRating: { "@type": "Rating", ratingValue: a.note, bestRating: 5 },
                author: { "@type": "Person", name: a.auteur.split(",")[0] },
                reviewBody: a.texte,
                datePublished: new Date(a.createdAt).toISOString().slice(0, 10),
              })),
            }
          : {}),
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.r } })),
      },
    ],
  };

  return (
    <div className="space-y-24 sm:space-y-28">

      {/* ─── Héros ─── */}
      <section className="grid items-center gap-12 pt-0 md:grid-cols-[1.1fr_.9fr] md:pt-2">
        <div style={{ animation: "monter .6s .05s both" }}>
          <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl">
            Le livre dont votre enfant est le héros.
          </h1>
          <p className="mt-5 font-serif text-xl italic text-or sm:text-2xl">
            « Encore une histoire ! » Ce soir, ce sera la sienne.
          </p>
          <p className="mt-4 max-w-[44ch] text-lg leading-relaxed text-magique-texteClair">
            Une histoire inventée pour lui, avec son prénom, son visage et ceux qu'il aime. Vous lisez
            toute l'histoire avant de décider de la garder.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href={cta} className="btn-primaire text-lg">
              Créer son histoire
            </Link>
            <Link href="/demo" className="inline-flex min-h-11 items-center font-semibold text-magique-primaire underline-offset-4 hover:underline">
              Lire un exemple
            </Link>
          </div>
          {!ventesOuvertes() && (
            <p className="mt-3 max-w-[52ch] text-sm text-or-clair">
              Créez et lisez son livre gratuitement dès ce soir. Les achats ouvrent le {DATE_OUVERTURE} : nous vous
              prévenons par email.
            </p>
          )}
          <ul className="mt-6 space-y-2.5">
            {PROMESSES.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-[15px] text-magique-texte">
                <Coche />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* De la photo au livre : la promesse, montrée d'un coup d'œil. */}
        <div className="relative mx-auto w-full max-w-[460px]" style={{ animation: "eclore .9s .15s both" }}>
          {/* Le livre en relief, couverture illustrée pleine page */}
          <div className="ml-auto w-[78%] [perspective:1400px]">
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-l-md rounded-r-2xl shadow-conte"
              style={{ transform: "rotateY(-14deg) rotateX(4deg)", transformStyle: "preserve-3d" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/exemple/noel/couverture.webp"
                alt="Couverture du livre de Léo : Le hoquet doré de la nuit de Noël"
                className="absolute inset-0 h-full w-full object-cover object-[45%_50%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a44]/90 via-transparent to-transparent" aria-hidden="true" />
              <div
                className="absolute inset-y-0 left-0 w-4"
                style={{ background: "linear-gradient(90deg,rgba(0,0,0,.4),rgba(255,255,255,.1))" }}
                aria-hidden="true"
              />
              <div className="absolute inset-x-6 bottom-6">
                <p className="font-serif text-2xl leading-tight text-white">Le hoquet doré de la nuit de Noël</p>
                <p className="mt-1 text-sm text-magique-texteClair">Une histoire écrite pour Léo</p>
              </div>
            </div>
          </div>

          {/* La photo d'origine, en polaroïd */}
          <figure
            className="absolute -left-1 top-0 w-[38%] rotate-[-7deg] rounded-md bg-white p-1.5 pb-6 shadow-conte sm:-left-6 sm:top-4 sm:w-[42%] sm:p-2 sm:pb-7"
            style={{ animation: "monter .7s .5s both" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/exemple/photo.webp" alt="La photo de Léo" className="aspect-[3/4] w-full rounded-sm object-cover" />
            <figcaption className="absolute inset-x-0 bottom-1 text-center font-serif text-xs italic text-nuit sm:bottom-1.5 sm:text-sm">
              La photo de Léo
            </figcaption>
          </figure>

        </div>
      </section>

      {/* ─── L'histoire d'un soir (ce que vit un parent) ─── */}
      <section id="exemple" className="scroll-mt-24">
        <h2 className="text-center text-3xl sm:text-4xl">Chaque soir, la même phrase…</h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-center font-serif text-xl italic text-or">« Encore une histoire, Maman ! »</p>
        <ol className="sans-barre -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
          {RECIT.map((r) => (
            <li key={r.img} className="w-[72%] flex-none snap-center sm:w-auto">
              <figure className="overflow-hidden rounded-3xl bg-white/[0.05] shadow-conte">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/histoire/${r.img}.webp`} alt={r.alt} width={900} height={1600} loading="lazy" className="aspect-[3/4] h-auto w-full object-cover object-top" />
                <figcaption className="p-4 text-[15px] leading-relaxed">{r.texte}</figcaption>
              </figure>
            </li>
          ))}
        </ol>
        <div className="mt-12 grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <video
            className="mx-auto w-full max-w-[300px] rounded-3xl shadow-conte"
            src="/video/encore-une-histoire.mp4"
            poster="/video/encore-une-histoire.webp"
            controls
            playsInline
            preload="none"
            aria-label="Le petit film « Encore une histoire ! », avec la voix d'une maman"
          />
          <div className="space-y-5 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl">Le soir où il s'est découvert dans son livre</h3>
            <p className="max-w-[46ch] text-magique-texteClair md:max-w-none">
              Une photo, et une histoire écrite rien que pour lui, avec son prénom, son visage et ceux
              qu'il aime. Le lendemain soir, c'est lui qui a demandé : « encore ».
            </p>
            <ol className="space-y-2 text-[15px]">
              {ETAPES.map((e) => (
                <li key={e.titre} className="flex items-center justify-center gap-3 md:justify-start">
                  <Illu nom={e.illu} alt="" className="h-10 w-10 flex-none object-contain" />
                  <span><strong>{e.titre}</strong> <span className="text-magique-texteClair">· {e.texte}</span></span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center justify-center gap-5 md:justify-start">
              <Link href={cta} className="btn-primaire">Créer son histoire</Link>
              <Link href="/demo" className="inline-flex min-h-11 items-center font-semibold text-magique-primaire underline-offset-4 hover:underline">
                Lire le livre de Léo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Un livre pour chaque âge ─── */}
      <section id="ages" className="scroll-mt-24">
        <h2 className="text-center text-3xl sm:text-4xl">Un vrai livre pour chaque âge</h2>
        <p className="mx-auto mt-3 max-w-[54ch] text-center text-magique-texteClair">
          On ne raconte pas la même chose à 2 ans et à 9 ans. Choisissez l'âge de votre enfant :
          le type de livre, les phrases et les dessins s'adaptent.
        </p>
        <AgeExplorer />
      </section>

      {/* ─── Styles de dessin ─── */}
      <section id="styles" className="scroll-mt-24">
        <h2 className="text-center text-3xl sm:text-4xl">Le style de dessin qu'il préfère</h2>
        <p className="mx-auto mt-3 max-w-[50ch] text-center text-magique-texteClair">
          La même scène, dessinée de mille façons : douce, rigolote, en BD, en manga… À lui de choisir.
        </p>
        {(() => {
          const vitrine = ["feerique", "aquarelle", "manga", "anim3d"] as const;
          const vignette = (k: (typeof ILLUSTRATION_STYLE_KEYS)[number]) => (
            <li key={k} className="overflow-hidden rounded-2xl bg-white/[0.06]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/styles/${k}.webp`} alt={`Exemple du style ${ILLUSTRATION_STYLES[k].label}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <p className="px-3 py-2 text-sm font-semibold text-magique-texte">{ILLUSTRATION_STYLES[k].label}</p>
            </li>
          );
          return (
            <>
              <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{vitrine.map(vignette)}</ul>
              <details className="group mt-4">
                <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center font-semibold text-magique-primaire underline-offset-4 hover:underline">
                  <span className="group-open:hidden">Voir tous les styles</span>
                  <span className="hidden group-open:inline">Masquer</span>
                </summary>
                <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {ILLUSTRATION_STYLE_KEYS.filter((k) => !(vitrine as readonly string[]).includes(k)).map(vignette)}
                </ul>
              </details>
            </>
          );
        })()}
      </section>

      {/* ─── Catalogue ─── */}
      <section id="themes" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl">Une histoire pour chaque moment</h2>
            <p className="mt-3 max-w-[50ch] text-magique-texteClair">
              Pour les fêtes, les grandes étapes et les petites émotions.
            </p>
          </div>
          <Link href="/catalogue" className="inline-flex min-h-11 items-center font-semibold text-magique-primaire underline-offset-4 hover:underline">
            Voir tout le catalogue
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {THEMES_VITRINE.map((id) => {
            const t = findThemeById(id);
            if (!t) return null;
            return (
              <Link
                key={t.id}
                href={`/creer?theme=${t.id}`} rel="nofollow"
                className="group flex flex-col gap-2 text-[15px] font-semibold text-magique-texte"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <CouvertureLivre src={couvertureTheme(t.id)} prenom={prenomExemple(t.id)} titre={titreCouvertureTheme(t.id, t.titre)} className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1.5" />
                <span className="leading-snug">{t.titre}</span>
                {t.saison && (
                  <span className="w-fit rounded-full bg-magique-rose/15 px-2 py-0.5 text-xs text-or-clair">De saison</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Qui fait Encore une histoire (affiché quand le texte est renseigné) ─── */}
      {FONDATEUR.prenom && FONDATEUR.phrase && (
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          {FONDATEUR.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={FONDATEUR.photo} alt={FONDATEUR.prenom} width={160} height={160} loading="lazy" className="h-32 w-32 flex-none rounded-full object-cover shadow-conte" />
          )}
          <figure>
            <blockquote className="font-serif text-xl italic leading-relaxed">« {FONDATEUR.phrase} »</blockquote>
            <figcaption className="mt-3 text-sm text-magique-texteClair">
              {FONDATEUR.prenom}{FONDATEUR.role ? `, ${FONDATEUR.role}` : ""} · créateur d'Encore une histoire, en France
            </figcaption>
          </figure>
        </section>
      )}

      {/* ─── Prix ─── */}
      <section id="prix" className="scroll-mt-24">
        <h2 className="text-center text-3xl sm:text-4xl">Des prix simples, payés une fois</h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-center text-magique-texteClair">
          Vous lisez d'abord. Vous payez seulement pour garder le livre, en une fois.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="carte flex flex-col">
            <h3 className="text-xl">Découvrir</h3>
            <p className="mt-2 font-serif text-4xl text-magique-texte">0 €</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
              <li className="flex gap-2"><Coche />Le livre complet, à l'écran</li>
              <li className="flex gap-2"><Coche />Lecture à voix haute</li>
              <li className="flex gap-2"><Coche />Sur ordinateur, tablette ou téléphone</li>
            </ul>
            <Link href={cta} className="btn-secondaire mt-6 w-full whitespace-nowrap px-3 text-[15px]">Créer gratuitement</Link>
          </div>

          <div className="carte flex flex-col">
            <h3 className="text-xl">Le livre</h3>
            <p className="mt-2 font-serif text-4xl text-magique-texte">{prix}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
              {KIT.map((k) => (
                <li key={k} className="flex gap-2"><Coche />{k}</li>
              ))}
            </ul>
            <Link href={cta} className="btn-secondaire mt-6 w-full whitespace-nowrap px-3 text-[15px]">Créer son histoire</Link>
          </div>

          <div className="carte flex flex-col">
            <h3 className="text-xl">Le livre premium</h3>
            <p className="mt-2 font-serif text-4xl text-magique-texte">{prixPremium}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
              <li className="flex gap-2"><Coche />Tout le livre PDF et son kit</li>
              <li className="flex gap-2"><Coche />Illustrations haute qualité</li>
              <li className="flex gap-2"><Coche />Ressemblance renforcée avec la photo</li>
            </ul>
            <Link href={cta} className="btn-secondaire mt-6 w-full whitespace-nowrap px-3 text-[15px]">Créer en premium</Link>
          </div>

          <div className="relative flex flex-col rounded-3xl border-2 border-magique-primaire bg-white/[0.1] p-6 shadow-douce">
            <span className="absolute -top-3 left-6 rounded-full bg-magique-primaire px-3 py-1 text-xs font-bold text-nuit">
              Idéal à offrir
            </span>
            <h3 className="text-xl">Le livre imprimé</h3>
            <p className="mt-2 font-serif text-4xl text-magique-texte">{euros(LIVRE_IMPRIME.priceCents)}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
              <li className="flex gap-2"><Coche />Relié, couverture rigide, 28 × 21 cm</li>
              <li className="flex gap-2"><Coche />30 pages, prêt à offrir</li>
              <li className="flex gap-2"><Coche />Livré chez vous en 7 à 10 jours ouvrés</li>
            </ul>
            <p className="mt-4 text-sm text-or-clair">Commandé avant le 10 décembre : sous le sapin.</p>
            <Link href={cta} className="btn-primaire mt-4 w-full whitespace-nowrap px-3 text-[15px]">Créer son livre</Link>
          </div>
        </div>
        <div className="carte mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px]">
            <Picto cle="offres/tout" taille={30} className="mr-1.5 inline-block align-middle" />
            <strong>Formule Tout compris, {euros(PACK_TOUT.priceCents)}</strong>
            <span className="text-magique-texteClair">
              {" "}— le livre et son kit, le Pack Fête d'anniversaire, l'affiche A3 et l'histoire
              en dessin animé.
            </span>
          </p>
          <span className="text-sm text-magique-texteClair">
            Ou à l'unité : {DELUXE_PRODUCTS.map((d) => `${d.label} ${euros(d.priceCents)}`).join(" · ")}
          </span>
        </div>
        <p className="mt-4 flex items-center justify-center gap-3 text-center text-[15px] text-magique-texteClair">
          <Picto cle="offres/club" taille={36} />
          <span>
            Plusieurs histoires par mois ? <Link href="/club" className="font-semibold text-magique-primaire underline-offset-4 hover:underline">Le Club</Link>, dès {euros(PLANS_CLUB.club.priceCents)} / mois, sans engagement.
          </span>
        </p>
      </section>

      {/* ─── Notre valeur, face au livre personnalisé classique ─── */}
      <section>
        <h2 className="text-center text-3xl sm:text-4xl">Pas un modèle où l'on change le prénom</h2>
        <p className="mx-auto mt-3 max-w-[54ch] text-center text-magique-texteClair">
          La plupart des livres personnalisés sont la même histoire pour tous les enfants, avec un prénom
          inséré. Ici, chaque livre est écrit et dessiné pour un seul enfant.
        </p>
        {/* Mobile : une fiche par critère (pas de tableau qui défile de côté). */}
        <ul className="mt-8 space-y-3 sm:hidden">
          {COMPARATIF.map(([critere, eux, nous]) => (
            <li key={critere} className="rounded-2xl bg-white/[0.05] p-4">
              <p className="font-semibold">{critere}</p>
              <p className="mt-2 text-[15px]"><span className="mr-1.5 text-or">✦</span>{nous}</p>
              <p className="mt-1 text-sm text-magique-texteClair">Ailleurs : {eux}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 hidden sm:block">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 overflow-hidden rounded-3xl border border-white/15 text-sm">
            <thead>
              <tr className="bg-white/[0.06]">
                <th className="p-4 text-left font-semibold"><span className="sr-only">Critère</span></th>
                <th className="p-4 text-left font-semibold text-magique-texteClair">Livre personnalisé classique</th>
                <th className="p-4 text-left font-semibold">✦ Encore une histoire</th>
              </tr>
            </thead>
            <tbody>
              {COMPARATIF.map(([critere, eux, nous]) => (
                <tr key={critere} className="border-t border-white/10">
                  <td className="border-t border-white/10 p-4 font-semibold">{critere}</td>
                  <td className="border-t border-white/10 p-4 text-magique-texteClair">{eux}</td>
                  <td className="border-t border-white/10 p-4">{nous}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Avis des parents (seulement quand il y en a de vrais) ─── */}
      {avis.total > 0 && (
        <section id="avis" className="scroll-mt-24">
          <h2 className="text-center text-3xl sm:text-4xl">Ce qu'en disent les parents</h2>
          <p className="mt-3 text-center">
            <Etoiles note={avis.moyenne} taille="text-xl" /> <strong>{avis.moyenne.toLocaleString("fr-FR")}/5</strong>{" "}
            <span className="text-magique-texteClair">· {avis.total} avis vérifié{avis.total > 1 ? "s" : ""}</span>
          </p>
          <div className="mt-8">
            <AvisListe avis={avis.avis.slice(0, 3)} />
          </div>
          <p className="mt-6 text-center">
            <Link href="/avis" className="font-semibold text-magique-primaire hover:underline">Lire tous les avis</Link>
          </p>
        </section>
      )}

      {/* ─── Questions fréquentes ─── */}
      <section id="faq" className="scroll-mt-24 mx-auto max-w-3xl">
        <h2 className="text-center text-3xl sm:text-4xl">Questions fréquentes</h2>
        <div className="mt-8 divide-y divide-magique-trait rounded-3xl border border-magique-trait bg-white/[0.06]">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-magique-texte">
                {f.q}
                <span className="text-xl text-magique-primaire transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-magique-texteClair">{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Appel final ─── */}
      <section
        id="appel-final"
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-12 shadow-conte sm:px-12 sm:py-14"
        style={{
          backgroundImage:
            "linear-gradient(180deg,#16245c,#0f1a44)",
        }}
      >
        <div className="grid items-center gap-8 md:grid-cols-[1fr_.8fr]">
          <div>
            <h2 className="text-3xl text-white sm:text-4xl">Ce soir, l'histoire parle de lui.</h2>
            <p className="mt-4 max-w-[42ch] text-magique-texteClair">
              Quelques minutes pour la créer, toute une vie pour s'en souvenir. Lecture gratuite, sans
              engagement.
            </p>
            <Link href={cta} className="btn-primaire mt-8 text-lg">
              Créer son histoire
            </Link>
            {!ventesOuvertes() && (
              <div className="mt-8 max-w-md">
                <p className="text-sm font-semibold text-white">Être prévenu(e) de l'ouverture des achats, le {DATE_OUVERTURE} :</p>
                <div className="mt-2">
                  <WaitlistForm source="accueil" />
                </div>
              </div>
            )}
          </div>
          <div className="mx-auto w-full max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/histoire/d_dort.webp" alt="Léo endormi, son livre serré contre lui" width={900} height={1600} loading="lazy" className="aspect-[4/5] h-auto w-full rounded-3xl object-cover object-top" />
          </div>
        </div>
      </section>
      {/* Données structurées (placées en fin : un élément invisible en tête
          décalait le haut de page à cause de l'espacement vertical). */}
      <BoutonCollant href={cta} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
