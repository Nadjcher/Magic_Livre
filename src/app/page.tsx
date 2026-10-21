/**
 * Page d'accueil « conte enchanté », épurée : un héros, le déroulé de création,
 * un rappel sobre des prolongements du livre, puis un appel final. Illustration
 * du héros 100 % vectorielle ; profondeur via les cartes en relief inclinables.
 */

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import Tilt3D from "@/components/Tilt3D";
import HeroIllustration from "@/components/HeroIllustration";

/** Étoile dorée à quatre branches (motif, employé avec parcimonie). */
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

/** Les prolongements du livre : icône au trait, homogène et sobre. */
const PLUS = [
  {
    titre: "À colorier",
    texte: "L'histoire en pages à imprimer.",
    icone: (
      <>
        <path d="M12 20c-4.4 0-8-3-8-7s3.6-8 8-8 8 3.4 8 7.5c0 2-1.7 3.5-3.7 3.5H15a1.4 1.4 0 00-1 2.4c.3.4.4.7.4 1.1 0 .6-.8 1-2.4 1z" />
        <circle cx="8" cy="11" r=".9" fill="currentColor" stroke="none" />
        <circle cx="12" cy="8.5" r=".9" fill="currentColor" stroke="none" />
        <circle cx="16" cy="11" r=".9" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    titre: "Projection",
    texte: "Les images projetées au mur.",
    icone: (
      <>
        <rect x="3" y="9" width="7.5" height="6" rx="1.4" />
        <path d="M10.5 10.5l9.5-3.2v9.4l-9.5-3.2" />
      </>
    ),
  },
  {
    titre: "Audio",
    texte: "La voix qui raconte, en MP3.",
    icone: (
      <>
        <path d="M4 10v4h3l4 3V7L7 10H4z" />
        <path d="M15.5 9.5a3.5 3.5 0 010 5M18 7a7 7 0 010 10" />
      </>
    ),
  },
  {
    titre: "Poster",
    texte: "Le héros en grand, au mur.",
    icone: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
        <path d="M7.5 15l3-3.5 2.5 2.5 2-2.5 1.5 2" />
        <circle cx="10" cy="8" r="1.1" fill="currentColor" stroke="none" />
      </>
    ),
  },
];

export default function AccueilPage() {
  return (
    <div className="space-y-24">
      {/* ─── Héros ─── */}
      <section
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-14 shadow-conte ring-1 ring-white/10 sm:px-12 sm:py-20"
        style={{
          backgroundImage:
            "radial-gradient(75% 60% at 80% 18%, rgba(154,122,224,.4), rgba(154,122,224,0) 60%), linear-gradient(180deg,#171338,#1b1544 55%,#15103a)",
        }}
      >
        {/* Ciel étoilé discret */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="#ffffff">
            <circle className="anim-scintille" cx="140" cy="90" r="1.5" />
            <circle cx="360" cy="150" r="1" opacity=".5" />
            <circle className="anim-scintille" cx="980" cy="80" r="1.4" style={{ animationDelay: "1.2s" }} />
            <circle cx="1120" cy="200" r="1.1" opacity=".5" />
            <circle className="anim-scintille" cx="220" cy="340" r="1.2" style={{ animationDelay: "1.8s" }} />
          </g>
        </svg>

        <div className="relative z-10 grid items-center gap-10 md:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="flex items-center gap-2 font-serif text-[15px] italic text-or-clair" style={{ animation: "monter .6s .05s both" }}>
              <Etoile className="h-3.5 w-3.5 text-or" />
              Une histoire unique, écrite pour votre enfant
            </p>
            <h1 className="mt-4 text-4xl leading-[1.05] text-white sm:text-6xl" style={{ animation: "monter .6s .13s both" }}>
              Il était une fois…
              <br />
              <span className="text-gradient italic">votre enfant.</span>
            </h1>
            <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-[#dcd6f4]" style={{ animation: "monter .6s .21s both" }}>
              Un prénom, quelques traits, et nous écrivons un conte doux et illustré
              à son image — parfait pour le rituel du soir.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5" style={{ animation: "monter .6s .29s both" }}>
              <Link href="/connexion" className="btn-primaire">
                Créer notre histoire
              </Link>
              <Link href="/cgu" className="font-semibold text-or-clair underline-offset-4 hover:underline">
                Comment ça marche
              </Link>
            </div>
            <p className="mt-6 text-sm text-[#b7aee0]" style={{ animation: "monter .6s .36s both" }}>
              Héros originaux, sans personnage sous droits. Aucune photo conservée.
            </p>
          </div>

          {/* Illustration vectorielle, profondeur 3D légère */}
          <div className="relative mx-auto w-full max-w-md" style={{ animation: "eclore .9s .18s both" }}>
            <Tilt3D>
              <div
                className="halo-pulse pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(50% 45% at 50% 42%, rgba(246,215,154,.45), rgba(246,215,154,0) 70%)" }}
                aria-hidden="true"
              />
              <HeroIllustration className="anim-flotte relative w-full" />
            </Tilt3D>
          </div>
        </div>
      </section>

      {/* ─── Comment naît le conte (séquence : chapitres) ─── */}
      <section>
        <header className="text-center">
          <h2 className="text-3xl sm:text-4xl">Comment naît votre conte ?</h2>
          <Ornement />
          <p className="mx-auto max-w-[44ch] text-magique-texteClair">
            Trois étapes, quelques minutes, et le livre est prêt à lire ensemble.
          </p>
        </header>
        <div className="relative mt-12">
          <div className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-[34px] hidden border-t-2 border-dashed border-or/40 sm:block" aria-hidden="true" />
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { num: "I", titre: "Vous imaginez", texte: "Le prénom, l'âge, puis un héros original ou votre propre idée d'aventure." },
              { num: "II", titre: "La plume s'anime", texte: "Une histoire douce et illustrée s'écrit en moins d'une minute." },
              { num: "III", titre: "Vous lisez ensemble", texte: "Page par page, à voix haute. Puis un joli PDF à imprimer et à garder." },
            ].map((c) => (
              <article key={c.num} data-tilt className="carte-relief p-7 text-center">
                <div
                  className="relief-avant mx-auto flex h-16 w-16 items-center justify-center rounded-full font-serif text-2xl text-white shadow-or"
                  style={{ backgroundImage: "linear-gradient(160deg,#9a5ae0,#6d28d9)" }}
                >
                  {c.num}
                </div>
                <h3 className="relief-milieu mt-4 text-xl">{c.titre}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-magique-texteClair">{c.texte}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Un rappel sobre des prolongements ─── */}
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

      {/* ─── Appel final ─── */}
      <section
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-center shadow-conte ring-1 ring-white/10 sm:px-12"
        style={{
          backgroundImage:
            "radial-gradient(60% 60% at 50% 0%, rgba(154,122,224,.45), rgba(154,122,224,0) 60%), linear-gradient(180deg,#1b1544,#15103a)",
        }}
      >
        <LogoMark className="anim-flotte mx-auto h-12 w-12 drop-shadow-md" />
        <h2 className="mt-5 text-3xl text-white sm:text-4xl">
          Ce soir, l'histoire parle de <span className="text-gradient italic">votre enfant.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[42ch] text-[#dcd6f4]">
          Lecture gratuite à l'écran, et le joli PDF à imprimer dès 4,99 €. Sans abonnement.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/connexion" className="btn-primaire text-lg">
            Créer l'histoire de mon enfant
          </Link>
        </div>
      </section>
    </div>
  );
}
