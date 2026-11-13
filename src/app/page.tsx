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
import { DELAI_IMPRIME, DELUXE_PRODUCTS, FORMAT_IMPRIME, LIVRE_IMPRIME, NOEL_LIMITE_DEFAUT, PACK_TOUT, PLANS_CLUB, mentionLancementImprime } from "@/lib/products";
import AgeExplorer from "@/components/AgeExplorer";
import WaitlistForm from "@/components/WaitlistForm";
import { DATE_OUVERTURE, ventesOuvertes } from "@/lib/lancement";
import AvisListe, { Etoiles } from "@/components/AvisListe";
import { avisPublics } from "@/lib/reviews";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { getAppUrl } from "@/lib/appUrl";
import { findThemeById, themeOuvert } from "@/lib/themes";
import Picto from "@/components/Picto";
import BoutonCollant from "@/components/BoutonCollant";
import { FONDATEUR } from "@/lib/fondateur";
import { ILLUSTRATION_STYLES, ILLUSTRATION_STYLE_KEYS, styleOuvert } from "@/lib/style_config";
import Lucioles from "@/components/accueil/Lucioles";
import LivreQuiSAnime from "@/components/accueil/LivreQuiSAnime";
import LivreMagique from "@/components/accueil/LivreMagique";
import { LIVRE_VITRINE } from "@/lib/livreVitrine";

export const metadata: Metadata = {
  title: { absolute: "Livre personnalisé pour enfant, illustré à son image · Encore une histoire" },
  alternates: { canonical: "/" },
};

const APP_URL = getAppUrl();

function euros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
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

/** Comment ça marche, avec les vraies images du livre de Léo. */
const ETAPES = [
  { img: LIVRE_VITRINE.photo, titre: "Une photo", texte: "Son prénom, son âge, son doudou, une photo. Choisissez un thème ou racontez votre idée." },
  { img: LIVRE_VITRINE.portrait, titre: "Son portrait peint", texte: "Nous le dessinons dans le style du livre. Vous nous dites « oui, c'est lui » avant tout le reste." },
  { img: LIVRE_VITRINE.couverture, titre: "Son livre, ce soir", texte: "Une histoire écrite pour son âge, illustrée page après page. À lire à l'écran, à imprimer ou relié." },
];

const THEMES_VITRINE = [
  "petit-poucet",
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
    r: "Oui. Créer le livre et lire toute l'histoire à l'écran ne coûte rien : la couverture et les 3 premières pages sont illustrées. Vous payez seulement pour garder le livre entièrement illustré (PDF et kit), en une fois, sans abonnement. Un livre gratuit par compte : pour en créer un autre, gardez d'abord le premier.",
  },
  {
    q: "Combien de temps faut-il ?",
    r: "Votre livre numérique en quelques minutes, votre livre imprimé après votre validation. L'histoire et ses illustrations sont créées en 3 minutes environ (un peu plus aux heures chargées : nous vous prévenons par email dès qu'il est prêt). Pour le livre imprimé, vous relisez chaque page et pouvez faire refaire deux dessins gratuitement avant l'impression ; il arrive ensuite en " + DELAI_IMPRIME + ".",
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

      {/* ─── Héros : la photo et le héros du livre, côte à côte, sous un ciel de lucioles ─── */}
      <section className="relative isolate overflow-hidden rounded-[2.5rem] px-5 pb-10 pt-8 sm:px-10 sm:py-14"
        style={{ backgroundImage: "radial-gradient(ellipse at 72% 40%, rgba(255,196,110,.22), transparent 55%), linear-gradient(180deg,#0f1a44 0%,#16245c 60%,#1e2c74 100%)" }}
      >
        <Lucioles nombre={9} />
        <div className="relative grid items-center gap-7 md:grid-cols-[1fr_1fr] md:gap-10">
          <div className="order-first md:order-none md:col-start-2 md:row-start-1">
            <LivreQuiSAnime />
          </div>
          <div className="md:col-start-1 md:row-start-1" style={{ animation: "monter .6s .05s both" }}>
            <h1 className="text-[2rem] leading-[1.08] text-white sm:text-[3.4rem]">
              Il ouvre le livre… et c'est lui dedans.
            </h1>
            <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-magique-texteClair sm:mt-5 sm:text-lg">
              Une photo suffit : nous le dessinons, vous dites «&nbsp;oui, c'est lui&nbsp;», et une histoire
              s'écrit pour son âge, avec son prénom, son doudou et ceux qu'il aime.<span className="hidden sm:inline"> Dragons, fusées ou
              pirates : c'est lui qui part à l'aventure.</span>
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 sm:mt-7">
              <Link href={cta} className="btn-primaire text-lg">
                Créer son livre gratuitement
              </Link>
              <Link href="#exemple" className="inline-flex min-h-11 items-center font-semibold text-[#ffd98a] underline-offset-4 hover:underline">
                Feuilleter le livre de Léo
              </Link>
            </div>
            <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-magique-texte">
              Vous lisez toute l'histoire avant de payer, sans carte bancaire. Vous la gardez pour {prix}, ou
              reliée en couverture rigide pour {euros(LIVRE_IMPRIME.priceCents)}
              {mentionLancementImprime() ? " (prix de lancement)" : ""}.
            </p>
            {!ventesOuvertes() && (
              <p className="mt-2 max-w-[52ch] text-sm text-or-clair">
                Les achats ouvrent le {DATE_OUVERTURE} : créez et lisez son livre dès ce soir, nous vous prévenons par email.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── Noël : la date limite, là où elle compte ─── */}
      <aside className="-mt-14 flex flex-col items-start gap-3 rounded-3xl border border-[#ffd98a]/30 bg-[#ffd98a]/[0.08] px-6 py-5 sm:-mt-16 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-magique-texte">
          <strong className="text-[#ffd98a]">Pour Noël :</strong> le livre relié commandé avant le {NOEL_LIMITE_DEFAUT} arrive sous le sapin.
          Un cadeau qu'aucun autre enfant n'aura.
        </p>
        <Link href={themeOuvert("noel") ? "/creer?theme=noel" : cta} rel="nofollow" className="btn-secondaire whitespace-nowrap px-4 text-[15px]">
          {themeOuvert("noel") ? "Créer son livre de Noël" : "Créer son livre"}
        </Link>
      </aside>

      {/* ─── Le livre de Léo, qui se feuillette tout seul ─── */}
      <section id="exemple" className="scroll-mt-24">
        <h2 className="text-center text-3xl sm:text-4xl">Ouvrez le livre de Léo</h2>
        <p className="mx-auto mt-3 max-w-[56ch] text-center text-magique-texteClair">
          Écrit pour un petit garçon de 4 ans qui a peur quand sa veilleuse s'éteint. Son ours Caramel, une
          phrase qui revient comme une berceuse, et c'est lui qui trouve la solution.
        </p>
        <div className="mx-auto mt-12 max-w-5xl">
          <LivreMagique href={cta} prix={prix} />
        </div>
        <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center justify-between gap-5 rounded-3xl bg-white/[0.06] px-6 py-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-serif text-2xl text-white">Le même, avec votre enfant dedans.</p>
            <p className="mt-1 text-[15px] text-magique-texteClair">
              Votre livre numérique en quelques minutes, votre livre imprimé après votre validation.
            </p>
          </div>
          <Link href={cta} className="btn-primaire whitespace-nowrap text-lg">Créer son livre gratuitement</Link>
        </div>
      </section>

      {/* ─── Le soir où il s'est découvert ─── */}
      <section className="relative isolate overflow-hidden rounded-[2.5rem] px-5 py-12 sm:px-10"
        style={{ backgroundImage: "linear-gradient(180deg,#16245c,#0f1a44)" }}
      >
        <Lucioles nombre={7} />
        <div className="relative grid items-center gap-8 md:grid-cols-2">
          <figure className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LIVRE_VITRINE.soirs[0]!.image} alt={LIVRE_VITRINE.soirs[0]!.alt} loading="lazy" className="aspect-square w-full rounded-[2rem] object-cover shadow-conte" />
            <figcaption className="absolute -bottom-4 left-6 rounded-2xl bg-white px-5 py-3 font-serif text-xl italic text-nuit shadow-conte">
              « C'est moi, là ? »
            </figcaption>
          </figure>
          <div className="space-y-6">
            <h2 className="text-3xl text-white sm:text-4xl">Le soir où il s'est découvert dans son livre</h2>
            <p className="max-w-[46ch] text-lg leading-relaxed text-magique-texteClair">
              Son visage, son prénom, son ours, sa chambre. Il reconnaît tout, et il écoute jusqu'à la dernière
              page. Le lendemain soir, c'est lui qui le rapporte : « Encore ! »
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LIVRE_VITRINE.soirs[1]!.image} alt={LIVRE_VITRINE.soirs[1]!.alt} loading="lazy" className="aspect-[16/10] w-full max-w-md rounded-3xl object-cover object-[50%_60%] shadow-conte" />
          </div>
        </div>
      </section>

      {/* ─── Comment ça marche ─── */}
      <section>
        <h2 className="text-center text-3xl sm:text-4xl">Trois étapes, quelques minutes</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {ETAPES.map((e, k) => (
            <li key={e.titre} className="carte flex flex-col gap-4">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.img} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover object-top" />
                <span className="absolute -top-3 -left-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#ffd98a] font-serif text-xl font-bold text-nuit shadow-conte">
                  {k + 1}
                </span>
              </div>
              <h3 className="text-xl">{e.titre}</h3>
              <p className="text-[15px] leading-relaxed text-magique-texteClair">{e.texte}</p>
            </li>
          ))}
        </ol>
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
          En 3D comme un film d'animation, en album peint, en BD, en manga… À lui de choisir.
        </p>
        {(() => {
          const vitrine = ["anim3d", "maison", "aquarelle", "manga"] as const;
          const vignette = (k: (typeof ILLUSTRATION_STYLE_KEYS)[number]) => (
            <li key={k} className="overflow-hidden rounded-2xl bg-white/[0.06]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/styles/${k}.webp`} alt={`Exemple du style ${ILLUSTRATION_STYLES[k].label}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <p className="px-3 py-2 text-sm font-semibold text-magique-texte">
                {ILLUSTRATION_STYLES[k].label}
                {!styleOuvert(k) && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-magique-texteClair">Bientôt</span>}
              </p>
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
          {/* Les histoires disponibles d'abord ; les autres sont annoncées « Bientôt ». */}
          {[...THEMES_VITRINE.filter(themeOuvert), ...THEMES_VITRINE.filter((id) => !themeOuvert(id))].map((id) => {
            const t = findThemeById(id);
            if (!t) return null;
            const ouvert = themeOuvert(t.id);
            return (
              <Link
                key={t.id}
                href={ouvert ? `/creer?theme=${t.id}` : `/catalogue/${t.id}`} rel="nofollow"
                className={`group flex flex-col gap-2 text-[15px] font-semibold text-magique-texte ${ouvert ? "" : "opacity-55"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <CouvertureLivre src={couvertureTheme(t.id)} prenom={prenomExemple(t.id)} titre={titreCouvertureTheme(t.id, t.titre)} className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1.5" />
                <span className="leading-snug">{t.titre}</span>
                {!ouvert ? (
                  <span className="w-fit rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-magique-texteClair">Bientôt</span>
                ) : (
                  t.saison && <span className="w-fit rounded-full bg-magique-rose/15 px-2 py-0.5 text-xs text-or-clair">De saison</span>
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
            {mentionLancementImprime() && <p className="mt-1 text-xs text-or-clair">{mentionLancementImprime()}</p>}
            <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
              <li className="flex gap-2"><Coche />Relié, couverture rigide, carré {FORMAT_IMPRIME}</li>
              <li className="flex gap-2"><Coche />30 pages, prêt à offrir</li>
              <li className="flex gap-2"><Coche />Relu et validé par vous avant l'impression</li>
              <li className="flex gap-2"><Coche />Livré chez vous en {DELAI_IMPRIME}</li>
            </ul>
            <p className="mt-4 text-sm text-or-clair">Commandé avant le {NOEL_LIMITE_DEFAUT} : sous le sapin.</p>
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
            <img src="/vitrine/page6.webp" alt="Léo endormi, son ours dans les bras" width={900} height={900} loading="lazy" className="aspect-square h-auto w-full rounded-3xl object-cover" />
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
