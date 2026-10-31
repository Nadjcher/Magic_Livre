/**
 * Landing page Storilou.
 *
 * Positionnement : une histoire écrite pour l'enfant (âge, thème), un héros à
 * son image, prête en deux minutes, et lue gratuitement AVANT tout paiement.
 * Un seul élément fort (le livre en relief du héros), le reste sobre.
 */

import Link from "next/link";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { getAppUrl } from "@/lib/appUrl";
import { findThemeById } from "@/lib/themes";

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
  "Lecture gratuite avant tout achat",
  "Adaptée à son âge (2 à 10 ans)",
  "Photo jamais conservée",
  "Sans abonnement",
];

const DIFFERENCES = [
  {
    icone: "✍️",
    titre: "Écrite pour lui, pas un modèle",
    texte:
      "Chaque histoire est inventée pour votre enfant : son prénom, son âge, le thème que vous choisissez. Deux livres ne se ressemblent jamais.",
  },
  {
    icone: "🎨",
    titre: "Un héros à son image",
    texte:
      "Ajoutez une photo : nous dessinons un héros qui lui ressemble, le même de la couverture à la dernière page.",
  },
  {
    icone: "⏱️",
    titre: "Prête le temps d'enfiler le pyjama",
    texte: "Une à deux minutes suffisent. Pas d'attente de plusieurs heures, pas de livraison à guetter.",
  },
  {
    icone: "👀",
    titre: "Vous la lisez avant de payer",
    texte:
      "Le livre entier s'affiche gratuitement à l'écran. Vous ne payez que si vous voulez le garder et l'imprimer.",
  },
];

const ETAPES = [
  {
    illu: "imagine",
    titre: "Choisissez un thème",
    texte: "Noël, premier jour d'école, dinosaures, peur du noir… ou votre propre idée.",
  },
  {
    illu: "write",
    titre: "Storilou écrit et illustre",
    texte: "Une histoire adaptée à son âge, illustrée à son image, en une à deux minutes.",
  },
  {
    illu: "together",
    titre: "Lisez-la ensemble",
    texte: "À l'écran, à voix haute ou projetée au mur. Gardez-la en PDF si elle vous plaît.",
  },
];

const THEMES_VITRINE = [
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
    r: "Une à deux minutes après avoir validé : l'histoire et toutes les illustrations sont créées pendant ce temps.",
  },
  {
    q: "Que devient la photo de mon enfant ?",
    r: "Elle sert uniquement à dessiner le héros pendant la création : elle est transmise à nos outils d'illustration le temps du dessin, puis nous ne la conservons jamais. Le livre ne contient que des illustrations.",
  },
  {
    q: "Pour quel âge ?",
    r: "De 2 à 10 ans. Le texte s'adapte : une phrase courte et douce par page pour les tout-petits, une vraie intrigue pour les plus grands.",
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${APP_URL}/#organization`, name: "Storilou", url: APP_URL, logo: `${APP_URL}/icon.svg` },
      { "@type": "WebSite", "@id": `${APP_URL}/#website`, url: APP_URL, name: "Storilou", inLanguage: "fr-FR", publisher: { "@id": `${APP_URL}/#organization` } },
      {
        "@type": "Product",
        name: "Livre illustré personnalisé pour enfant",
        description:
          "Une histoire écrite pour votre enfant, adaptée à son âge et illustrée à son image, prête en deux minutes. Lecture gratuite à l'écran, PDF à imprimer.",
        brand: { "@id": `${APP_URL}/#organization` },
        offers: {
          "@type": "Offer",
          price: (env.bookPriceCents() / 100).toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${APP_URL}/creer`,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.r } })),
      },
    ],
  };

  return (
    <div className="space-y-24 sm:space-y-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ─── Héros ─── */}
      <section className="grid items-center gap-12 pt-4 md:grid-cols-[1.1fr_.9fr] md:pt-10">
        <div style={{ animation: "monter .6s .05s both" }}>
          <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl">
            Le livre dont votre enfant est le héros.
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-magique-texteClair">
            Une histoire écrite pour lui, adaptée à son âge et illustrée à son image. Prête en deux
            minutes, et vous la lisez gratuitement avant de payer quoi que ce soit.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href={cta} className="btn-primaire text-lg">
              Créer son histoire
            </Link>
            <Link href="/demo" className="font-semibold text-magique-primaire underline-offset-4 hover:underline">
              Lire un exemple
            </Link>
          </div>
          <ul className="mt-8 grid max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PROMESSES.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-magique-texte">
                <Coche />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Le livre en relief : l'élément fort de la page. */}
        <div className="relative mx-auto w-full max-w-[340px]" style={{ animation: "eclore .9s .15s both" }}>
          <div className="[perspective:1400px]">
            <div
              className="relative aspect-[4/5] rounded-l-md rounded-r-2xl shadow-conte"
              style={{
                transform: "rotateY(-16deg) rotateX(5deg)",
                transformStyle: "preserve-3d",
                backgroundImage: "linear-gradient(160deg,#23356f,#0f1a44)",
              }}
            >
              <div
                className="absolute inset-y-0 left-0 w-4 rounded-l-md"
                style={{ background: "linear-gradient(90deg,rgba(0,0,0,.35),rgba(255,255,255,.08))" }}
                aria-hidden="true"
              />
              <div
                className="absolute -right-2 bottom-3 top-3 w-2.5 rounded-r-sm"
                style={{ background: "repeating-linear-gradient(180deg,#fdfbff 0 2px,#dfe5f6 2px 3px)" }}
                aria-hidden="true"
              />
              <div className="absolute inset-x-7 top-7 rounded-xl bg-[#e9eefc] p-2">
                <Illu nom="hero" alt="Couverture : un enfant lit au lit sous un ciel étoilé" className="aspect-square w-full object-contain" />
              </div>
              <div className="absolute inset-x-7 bottom-7">
                <p className="font-serif text-2xl leading-tight text-white">Léo et la nuit des lucioles</p>
                <p className="mt-1 text-sm text-[#cdd7f4]">Une histoire écrite pour Léo, 5 ans</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-magique-texte shadow-conte sm:-left-8">
            <Coche />
            Prête en deux minutes
          </div>
        </div>
      </section>

      {/* ─── Ce qui fait la différence ─── */}
      <section className="grid gap-10 md:grid-cols-[.85fr_1.15fr] md:gap-14">
        <div>
          <h2 className="text-3xl leading-tight sm:text-4xl">
            Une vraie histoire, pensée pour votre enfant.
          </h2>
          <p className="mt-4 max-w-[38ch] text-magique-texteClair">
            Pas un texte tout prêt où l'on glisse son prénom : un récit inventé pour lui, que vous
            découvrez avant de décider.
          </p>
        </div>
        <ul className="grid gap-8 sm:grid-cols-2">
          {DIFFERENCES.map((d) => (
            <li key={d.titre}>
              <span className="text-3xl" aria-hidden="true">{d.icone}</span>
              <h3 className="mt-3 text-xl">{d.titre}</h3>
              <p className="mt-2 leading-relaxed text-magique-texteClair">{d.texte}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Comment ça marche (vraie séquence) ─── */}
      <section>
        <h2 className="text-center text-3xl sm:text-4xl">Trois étapes, et c'est prêt</h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="carte-relief flex flex-col items-center p-7 text-center">
              <Illu nom={e.illu} alt="" className="mb-4 h-32 w-full object-contain" />
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-magique-primaire font-serif text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 text-xl">{e.titre}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-magique-texteClair">{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── Catalogue ─── */}
      <section className="rounded-[2rem] border border-magique-trait bg-white/70 px-6 py-10 sm:px-10">
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
        <div className="mt-8 flex flex-wrap gap-3">
          {THEMES_VITRINE.map((id) => {
            const t = findThemeById(id);
            if (!t) return null;
            return (
              <Link
                key={t.id}
                href={`/creer?theme=${t.id}`}
                className="flex items-center gap-2 rounded-full border border-magique-trait bg-white px-4 py-2 text-[15px] font-semibold text-magique-texte transition hover:border-magique-primaire hover:text-magique-primaire"
              >
                <span aria-hidden="true">{t.emoji}</span>
                {t.titre}
                {t.saison && (
                  <span className="rounded-full bg-magique-rose/15 px-2 py-0.5 text-xs text-magique-rose">De saison</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Prix ─── */}
      <section>
        <h2 className="text-center text-3xl sm:text-4xl">Des prix simples, sans abonnement</h2>
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
              <li className="flex gap-2"><Coche />Mode projection au mur</li>
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

          <div className="relative flex flex-col rounded-3xl border-2 border-magique-primaire bg-white p-6 shadow-or">
            <span className="absolute -top-3 left-6 rounded-full bg-magique-primaire px-3 py-1 text-xs font-bold text-white">
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
      </section>

      {/* ─── Questions fréquentes ─── */}
      <section className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl sm:text-4xl">Questions fréquentes</h2>
        <div className="mt-8 divide-y divide-magique-trait rounded-3xl border border-magique-trait bg-white/80">
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
            "radial-gradient(60% 70% at 15% 20%, rgba(91,155,255,.4), rgba(91,155,255,0) 60%), linear-gradient(180deg,#16245c,#0f1a44)",
        }}
      >
        <div className="grid items-center gap-8 md:grid-cols-[1fr_.8fr]">
          <div>
            <h2 className="text-3xl text-white sm:text-4xl">Ce soir, l'histoire parle de lui.</h2>
            <p className="mt-4 max-w-[42ch] text-[#cdd7f4]">
              Deux minutes pour la créer, toute une vie pour s'en souvenir. Lecture gratuite, sans
              engagement.
            </p>
            <Link href={cta} className="btn-primaire mt-8 text-lg">
              Créer son histoire
            </Link>
          </div>
          <div className="mx-auto w-full max-w-xs">
            <Illu nom="nuit" alt="Un enfant lit au lit sous la lune et les étoiles" className="w-full rounded-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
