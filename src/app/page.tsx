/**
 * Landing page Encore une histoire.
 *
 * Positionnement : une histoire écrite pour l'enfant (âge, thème), un héros à
 * son image, prête en quelques minutes, et lue gratuitement AVANT tout paiement.
 * Un seul élément fort (le livre en relief du héros), le reste sobre.
 */

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
                ["Délai", "Plusieurs jours", "Environ 3 minutes"],
                ["Prix", "25 à 40 €", "Dès 6,99 €"],
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
    q: "C'est vraiment gratuit ?",
    r: "Oui. Créer le livre et le lire en entier à l'écran ne coûte rien. Vous payez seulement si vous voulez télécharger le PDF et le kit, en une fois, sans abonnement.",
  },
  {
    q: "Combien de temps faut-il ?",
    r: "Quelques minutes après avoir validé (environ 3 minutes) : l'histoire et toutes les illustrations sont créées pendant ce temps.",
  },
  {
    q: "Que devient la photo de mon enfant ?",
    r: "Elle sert uniquement à dessiner le héros pendant la création : elle est transmise à nos outils d'illustration le temps du dessin, puis nous ne la conservons jamais. Le livre ne contient que des illustrations.",
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
            Une histoire inventée pour lui, avec son prénom, son visage et ceux qu'il aime. Vous la
            lisez en entier avant de décider de la garder.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href={cta} className="btn-primaire text-lg">
              Créer son histoire
            </Link>
            <Link href="/demo" className="inline-flex min-h-11 items-center font-semibold text-magique-primaire underline-offset-4 hover:underline">
              Lire un exemple
            </Link>
          </div>
          <p className="mt-4 text-sm text-magique-texteClair">
            Lecture gratuite. Vous payez seulement pour garder le livre : PDF dès {prix}, livre imprimé {euros(LIVRE_IMPRIME.priceCents)}.
          </p>
          {!ventesOuvertes() && (
            <div className="mt-6 max-w-lg rounded-2xl border border-white/15 bg-white/[0.06] p-4">
              <p className="text-sm font-semibold">✨ Ouverture des commandes le {DATE_OUVERTURE}. Soyez prévenu(e) :</p>
              <div className="mt-2">
                <WaitlistForm source="accueil" />
              </div>
            </div>
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
                src="/exemple/couverture.webp"
                alt="Couverture du livre : Léo et son renard entrent dans la forêt des lanternes"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a44]/90 via-transparent to-transparent" aria-hidden="true" />
              <div
                className="absolute inset-y-0 left-0 w-4"
                style={{ background: "linear-gradient(90deg,rgba(0,0,0,.4),rgba(255,255,255,.1))" }}
                aria-hidden="true"
              />
              <div className="absolute inset-x-6 bottom-6">
                <p className="font-serif text-2xl leading-tight text-white">Léo et la forêt des lanternes</p>
                <p className="mt-1 text-sm text-[#dce3ff]">Une histoire écrite pour Léo, 5 ans</p>
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

      {/* ─── Comment ça marche (vraie séquence) ─── */}
      <section id="comment" className="scroll-mt-24">
        <h2 className="text-center text-3xl sm:text-4xl">Trois étapes, et c'est prêt</h2>
        <ol className="relative mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
          <li aria-hidden="true" className="pointer-events-none absolute left-[18%] right-[18%] top-20 hidden border-t-2 border-dashed border-white/20 sm:block" />
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="relative flex flex-col items-center text-center">
              <Illu nom={e.illu} alt="" className="h-40 w-40 object-contain drop-shadow-[0_18px_24px_rgba(5,10,40,.45)]" />
              <h3 className="mt-4 text-xl">
                <span className="mr-1.5 font-serif text-or">{i + 1}.</span>
                {e.titre}
              </h3>
              <p className="mt-2 max-w-[30ch] text-[15px] leading-relaxed text-magique-texteClair">{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── De la photo au livre ─── */}
      <section id="exemple" className="scroll-mt-24">
        <h2 className="text-center text-3xl sm:text-4xl">De sa photo à son livre</h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-center text-magique-texteClair">
          Vous ajoutez une photo, on dessine un héros qui lui ressemble vraiment, le même à
          chaque page, dans une histoire inventée pour lui.
        </p>
        <div className="mt-10 grid items-center gap-5 md:grid-cols-[.6fr_auto_1.4fr]">
          <figure className="mx-auto w-full max-w-[260px] rotate-[-3deg] rounded-md bg-white p-2 pb-8 shadow-conte">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/exemple/photo.webp" alt="Photo d'exemple d'un enfant" loading="lazy" className="aspect-[3/4] w-full rounded-sm object-cover" />
            <figcaption className="mt-2 text-center font-serif text-sm italic text-nuit">La photo envoyée</figcaption>
          </figure>
          <p className="text-center text-3xl text-or" aria-hidden="true">→</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { src: "/exemple/page-pont.webp", txt: "« Le petit renard tendit la patte : “Par ici, Léo, le pont des lucioles !” »" },
              { src: "/exemple/page-lanternes.webp", txt: "« Du haut de la colline, Léo libéra toutes les lanternes du ciel. »" },
            ].map((p) => (
              <figure key={p.src} className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] shadow-conte">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="Page illustrée du livre d'exemple" loading="lazy" className="aspect-[16/9] w-full object-cover" />
                <figcaption className="p-3 text-sm italic text-magique-texteClair">{p.txt}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-[13px] text-magique-texteClair">
          Exemple réalisé avec un enfant fictif. Votre photo n'est jamais conservée.
        </p>
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
        <h2 className="text-center text-3xl sm:text-4xl">12 styles de dessin, au choix</h2>
        <p className="mx-auto mt-3 max-w-[50ch] text-center text-magique-texteClair">
          La même scène, dessinée de douze façons. Choisissez celle que votre enfant préférera.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ILLUSTRATION_STYLE_KEYS.map((k) => (
            <li key={k} className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/styles/${k}.webp`}
                alt={`Exemple du style ${ILLUSTRATION_STYLES[k].label}`}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <p className="px-3 py-2 text-sm font-semibold text-magique-texte">
                {ILLUSTRATION_STYLES[k].label}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Catalogue ─── */}
      <section id="themes" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl">Une histoire pour chaque moment</h2>
            <p className="mt-3 max-w-[50ch] text-magique-texteClair">
              Plus de 30 thèmes pour les fêtes, les grandes étapes et les petites émotions.
            </p>
          </div>
          <Link href="/catalogue" className="font-semibold text-magique-primaire underline-offset-4 hover:underline">
            Voir tout le catalogue
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {THEMES_VITRINE.map((id) => {
            const t = findThemeById(id);
            if (!t) return null;
            return (
              <Link
                key={t.id}
                href={`/creer?theme=${t.id}`}
                className="group flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center text-[15px] font-semibold text-magique-texte transition hover:bg-white/[0.07]"
              >
                <Picto cle={`themes/${t.id}`} secours={t.emoji} taille={72} className="transition duration-300 group-hover:-translate-y-1 group-hover:rotate-[-3deg]" />
                <span className="leading-snug">{t.titre}</span>
                {t.saison && (
                  <span className="rounded-full bg-magique-rose/15 px-2 py-0.5 text-xs text-or-clair">De saison</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Ce que vous recevez ─── */}
      <section id="offres" className="scroll-mt-24">
        <h2 className="text-center text-3xl sm:text-4xl">Ce que vous recevez</h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-center text-magique-texteClair">
          Vous lisez d'abord le livre en entier, gratuitement. Ensuite, gardez-le sous la forme qui vous plaît.
        </p>
        <ul className="mx-auto mt-8 grid max-w-5xl gap-x-12 sm:grid-cols-2">
          {[
            ["offres/ecran", "La lecture à l'écran", "Le livre complet, sur ordinateur, tablette ou téléphone, avec lecture à voix haute.", "Gratuit"],
            ["offres/pdf", "Le livre PDF + son kit", "À imprimer chez vous, avec coloriage, affiche, invitation, autocollants et marque-pages.", `Dès ${prix}`],
            ["offres/imprime", "Le livre imprimé", "Relié, couverture rigide, 28 × 21 cm, 30 pages. Imprimé et livré chez vous.", euros(LIVRE_IMPRIME.priceCents)],
            ["offres/video", "Le livre en dessin animé", "Chaque page s'anime et une voix raconte l'histoire, en musique. Une vraie vidéo.", euros(DELUXE_PRODUCTS.find((d) => d.sku === "video")?.priceCents ?? 999)],
            ["offres/fete", "Le pack fête et l'affiche A3", "Invitations, banderole et étiquettes à son image, et le héros en grand format.", `Dès ${euros(Math.min(...DELUXE_PRODUCTS.filter((d) => d.sku !== "video").map((d) => d.priceCents)))}`],
            ["offres/club", "Le Club des histoires", "Un nouveau livre chaque semaine et les grands classiques revisités, sans engagement.", `Dès ${euros(PLANS_CLUB.club.priceCents)} / mois`],
          ].map(([icone, titre, texte, tarif]) => (
            <li key={titre} className="flex items-start gap-4 border-t border-white/10 py-5">
              <Picto cle={icone ?? ""} taille={64} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-3">
                  <h3 className="text-lg">{titre}</h3>
                  <p className="font-serif text-lg text-or-clair">{tarif}</p>
                </div>
                <p className="mt-1 text-sm text-magique-texteClair">{texte}</p>
              </div>
            </li>
          ))}
        </ul>
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
                <th className="p-4 text-left font-semibold"> </th>
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

      {/* ─── Prix ─── */}
      <section id="prix" className="scroll-mt-24">
        <h2 className="text-center text-3xl sm:text-4xl">Des prix simples, payés une fois</h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-center text-magique-texteClair">
          Vous lisez d'abord. Vous payez seulement pour garder le livre, en une fois.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="carte flex flex-col">
            <h3 className="text-xl">Découvrir</h3>
            <p className="mt-2 font-serif text-4xl text-magique-texte">0 €</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
              <li className="flex gap-2"><Coche />Le livre complet, à l'écran</li>
              <li className="flex gap-2"><Coche />Lecture à voix haute</li>
              <li className="flex gap-2"><Coche />Sur ordinateur, tablette ou téléphone</li>
            </ul>
            <Link href={cta} className="btn-secondaire mt-6">Créer gratuitement</Link>
          </div>

          <div className="carte flex flex-col">
            <h3 className="text-xl">Le livre</h3>
            <p className="mt-2 font-serif text-4xl text-magique-texte">{prix}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
              {KIT.map((k) => (
                <li key={k} className="flex gap-2"><Coche />{k}</li>
              ))}
            </ul>
            <Link href={cta} className="btn-secondaire mt-6">Créer son histoire</Link>
          </div>

          <div className="relative flex flex-col rounded-3xl border-2 border-magique-primaire bg-white/[0.1] p-6 shadow-douce">
            <span className="absolute -top-3 left-6 rounded-full bg-magique-primaire px-3 py-1 text-xs font-bold text-nuit">
              Idéal à offrir
            </span>
            <h3 className="text-xl">Premium</h3>
            <p className="mt-2 font-serif text-4xl text-magique-texte">{prixPremium}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
              <li className="flex gap-2"><Coche />Tout le contenu du livre et du kit</li>
              <li className="flex gap-2"><Coche />Illustrations haute qualité</li>
              <li className="flex gap-2"><Coche />Ressemblance renforcée avec la photo</li>
            </ul>
            <Link href={cta} className="btn-primaire mt-6">Créer en premium</Link>
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
            <Picto cle="offres/imprime" taille={22} className="mr-1 inline-block align-middle" />
            Livre imprimé et relié, livré chez vous : {euros(LIVRE_IMPRIME.priceCents)}.<br />
            Ou à l'unité : {DELUXE_PRODUCTS.map((d) => `${d.label} ${euros(d.priceCents)}`).join(" · ")}
          </span>
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
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-magique-texte">
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
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-12 shadow-conte sm:px-12 sm:py-14"
        style={{
          backgroundImage:
            "linear-gradient(180deg,#16245c,#0f1a44)",
        }}
      >
        <div className="grid items-center gap-8 md:grid-cols-[1fr_.8fr]">
          <div>
            <h2 className="text-3xl text-white sm:text-4xl">Ce soir, l'histoire parle de lui.</h2>
            <p className="mt-4 max-w-[42ch] text-[#cdd7f4]">
              Quelques minutes pour la créer, toute une vie pour s'en souvenir. Lecture gratuite, sans
              engagement.
            </p>
            <Link href={cta} className="btn-primaire mt-8 text-lg">
              Créer son histoire
            </Link>
          </div>
          <div className="mx-auto w-full max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/exemple/page-lanternes.webp" alt="Léo libère des lanternes dans le ciel étoilé" width={1200} height={675} loading="lazy" className="h-auto w-full rounded-3xl" />
          </div>
        </div>
      </section>
      {/* Données structurées (placées en fin : un élément invisible en tête
          décalait le haut de page à cause de l'espacement vertical). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
