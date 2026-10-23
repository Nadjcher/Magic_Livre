/**
 * Page d'accueil « monde illustré chaleureux » : héros clair et accueillant avec
 * une vraie illustration, un déroulé illustré, un rappel sobre des plus, et un
 * appel final « nuit » pour le rituel du soir.
 *
 * Illustrations : unDraw (licence libre, sans attribution), recolorisées à la
 * palette de la marque. Fichiers dans /public/illustrations/undraw.
 */

import Link from "next/link";
import Tilt3D from "@/components/Tilt3D";
import { SceneIllustration, type SceneName } from "@/components/Illustrations";

const APP_URL = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Données structurées (JSON-LD) : marque, site et offre produit. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "Mon Livre Magique",
      url: APP_URL,
      logo: `${APP_URL}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "Mon Livre Magique",
      inLanguage: "fr-FR",
      publisher: { "@id": `${APP_URL}/#organization` },
    },
    {
      "@type": "Product",
      name: "Livre illustré personnalisé pour enfant",
      description:
        "Un conte illustré unique, écrit à partir du prénom et de l'âge de votre enfant, " +
        "avec un héros original. Lecture gratuite à l'écran et PDF à imprimer.",
      brand: { "@id": `${APP_URL}/#organization` },
      offers: {
        "@type": "Offer",
        price: "4.99",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${APP_URL}/creer`,
      },
    },
  ],
};

function Etoile({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z" />
    </svg>
  );
}

function Ornement() {
  return (
    <div className="ornement my-4" aria-hidden="true">
      <Etoile className="h-4 w-4" />
    </div>
  );
}

/** Vignette vectorielle de la marque (voir components/Illustrations). */
function Illu({ nom, alt, className = "" }: { nom: SceneName; alt: string; className?: string }) {
  return <SceneIllustration name={nom} alt={alt} className={className} />;
}

const ETAPES: { num: string; illu: SceneName; titre: string; texte: string }[] = [
  { num: "I", illu: "imagine", titre: "Vous imaginez", texte: "Le prénom, l'âge, puis un héros original ou votre propre idée d'aventure." },
  { num: "II", illu: "write", titre: "La plume s'anime", texte: "Une histoire douce et illustrée s'écrit en moins d'une minute." },
  { num: "III", illu: "together", titre: "Vous lisez ensemble", texte: "Page par page, à voix haute. Puis un joli PDF à imprimer et à garder." },
];

const PLUS = [
  { titre: "À colorier", texte: "L'histoire en pages à imprimer.", icone: (<><path d="M12 20c-4.4 0-8-3-8-7s3.6-8 8-8 8 3.4 8 7.5c0 2-1.7 3.5-3.7 3.5H15a1.4 1.4 0 00-1 2.4c.3.4.4.7.4 1.1 0 .6-.8 1-2.4 1z" /><circle cx="8" cy="11" r=".9" fill="currentColor" stroke="none" /><circle cx="12" cy="8.5" r=".9" fill="currentColor" stroke="none" /><circle cx="16" cy="11" r=".9" fill="currentColor" stroke="none" /></>) },
  { titre: "Projection", texte: "Les images projetées au mur.", icone: (<><rect x="3" y="9" width="7.5" height="6" rx="1.4" /><path d="M10.5 10.5l9.5-3.2v9.4l-9.5-3.2" /></>) },
  { titre: "Audio", texte: "La voix qui raconte, en MP3.", icone: (<><path d="M4 10v4h3l4 3V7L7 10H4z" /><path d="M15.5 9.5a3.5 3.5 0 010 5M18 7a7 7 0 010 10" /></>) },
  { titre: "Poster", texte: "Le héros en grand, au mur.", icone: (<><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M7.5 15l3-3.5 2.5 2.5 2-2.5 1.5 2" /><circle cx="10" cy="8" r="1.1" fill="currentColor" stroke="none" /></>) },
];

export default function AccueilPage() {
  return (
    <div className="space-y-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* ─── Héros clair et chaleureux ─── */}
      <section
        className="relative overflow-hidden rounded-[2.5rem] border border-magique-trait px-6 py-12 sm:px-12 sm:py-16"
        style={{
          backgroundImage:
            "radial-gradient(60% 55% at 85% 25%, rgba(224,124,192,.42), rgba(224,124,192,0) 60%), radial-gradient(55% 60% at 8% 95%, rgba(109,59,209,.16), rgba(109,59,209,0) 60%), linear-gradient(180deg,#faf8ff,#efeafc)",
        }}
      >
        <Etoile className="anim-scintille pointer-events-none absolute left-[8%] top-[18%] h-4 w-4 text-or" aria-hidden="true" />
        <Etoile className="anim-scintille pointer-events-none absolute right-[10%] top-[14%] h-3 w-3 text-or-fonce" style={{ animationDelay: "1s" }} aria-hidden="true" />

        <div className="relative z-10 grid items-center gap-10 md:grid-cols-[1.02fr_.98fr]">
          <div>
            <p className="flex items-center gap-2 font-serif text-[15px] italic text-or-fonce" style={{ animation: "monter .6s .05s both" }}>
              <Etoile className="h-3.5 w-3.5 text-or" />
              Une histoire unique, écrite pour votre enfant
            </p>
            <h1 className="mt-4 text-4xl leading-[1.05] sm:text-6xl" style={{ animation: "monter .6s .13s both" }}>
              Il était une fois…
              <br />
              <span className="text-gradient italic">votre enfant.</span>
            </h1>
            <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-magique-texteClair" style={{ animation: "monter .6s .21s both" }}>
              Un prénom, quelques traits, et nous écrivons un conte doux et illustré
              à son image — parfait pour le rituel du soir.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5" style={{ animation: "monter .6s .29s both" }}>
              <Link href="/connexion" className="btn-primaire">
                Créer notre histoire
              </Link>
              <Link href="/demo" className="font-semibold text-magique-primaire underline-offset-4 hover:underline">
                Voir un exemple ✦
              </Link>
            </div>
            <p className="mt-6 text-sm text-magique-texteClair" style={{ animation: "monter .6s .36s both" }}>
              Héros originaux, sans personnage sous droits. Aucune photo conservée.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md" style={{ animation: "eclore .9s .18s both" }}>
            <Tilt3D>
              <Illu nom="hero" alt="Un enfant lit un livre qui brille sous un ciel étoilé" className="relative w-full rounded-[2rem]" />
            </Tilt3D>
          </div>
        </div>
      </section>

      {/* ─── Comment naît le conte (illustré) ─── */}
      <section>
        <header className="text-center">
          <h2 className="text-3xl sm:text-4xl">Comment naît votre conte ?</h2>
          <Ornement />
          <p className="mx-auto max-w-[44ch] text-magique-texteClair">
            Trois étapes, quelques minutes, et le livre est prêt à lire ensemble.
          </p>
        </header>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {ETAPES.map((e) => (
            <article key={e.num} data-tilt className="carte-relief flex flex-col items-center p-7 text-center">
              <Illu nom={e.illu} alt="" className="relief-milieu mb-4 h-36 w-full object-contain" />
              <div className="flex items-center gap-2 font-serif italic text-or-fonce">
                <span className="relief-avant flex h-8 w-8 items-center justify-center rounded-full bg-parch-2 text-sm not-italic text-or-fonce">
                  {e.num}
                </span>
                Chapitre {e.num}
              </div>
              <h3 className="relief-milieu mt-2 text-xl">{e.titre}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-magique-texteClair">{e.texte}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Rappel sobre des prolongements ─── */}
      <section className="carte-relief p-8 sm:p-10">
        <header className="text-center">
          <h2 className="text-2xl sm:text-3xl">Bien plus qu'un simple livre</h2>
          <Ornement />
        </header>
        <div className="mt-6 grid gap-6 sm:grid-cols-4">
          {PLUS.map((p) => (
            <div key={p.titre} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-magique-primaire/10 text-magique-primaire">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {p.icone}
                </svg>
              </span>
              <h3 className="text-lg">{p.titre}</h3>
              <p className="text-sm leading-relaxed text-magique-texteClair">{p.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Appel final : le rituel du soir (nuit) ─── */}
      <section
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-12 shadow-conte ring-1 ring-white/10 sm:px-12 sm:py-14"
        style={{
          backgroundImage:
            "radial-gradient(60% 70% at 15% 20%, rgba(154,122,224,.4), rgba(154,122,224,0) 60%), linear-gradient(180deg,#1b1544,#15103a)",
        }}
      >
        <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1fr_.8fr]">
          <div>
            <h2 className="text-3xl text-white sm:text-4xl">
              Ce soir, l'histoire parle de <span className="text-gradient italic">votre enfant.</span>
            </h2>
            <p className="mt-4 max-w-[42ch] text-[#dcd6f4]">
              Lecture gratuite à l'écran, et le joli PDF à imprimer dès 4,99 €. Sans abonnement.
            </p>
            <div className="mt-8">
              <Link href="/connexion" className="btn-primaire text-lg">
                Créer l'histoire de mon enfant
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xs">
            <Illu nom="nuit" alt="Un enfant lit au lit sous la lune et les étoiles" className="w-full rounded-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
