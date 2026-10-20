/**
 * Page d'accueil « conte enchanté » : héros nuit étoilée avec livre lumineux,
 * chapitres en relief, les petits plus du livre, garanties et un extrait.
 * Les cartes en relief + inclinaison au pointeur donnent une vraie profondeur 3D.
 */

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import Tilt3D from "@/components/Tilt3D";

/** Petite étoile dorée à quatre branches (motif récurrent). */
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

/** Petite pastille de réassurance (sous les boutons du héros). */
function Gage({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[13px] text-[#e7e1ff] ring-1 ring-white/15 backdrop-blur">
      <Etoile className="h-3 w-3 text-or" />
      {children}
    </span>
  );
}

/** Les « petits plus » du livre, avec leurs icônes. */
const EXTRAS = [
  {
    titre: "Livre de coloriage",
    texte: "La même histoire en pages à colorier, prêtes à imprimer pour les après-midis pluvieux.",
    icone: (
      <>
        <path d="M12 19c-4.5 0-8-2.9-8-6.5S7.5 4 12 4s8 3.6 8 7.5c0 2-1.6 3.5-3.6 3.5H15c-.8 0-1.4.6-1.4 1.4 0 .4.2.7.4 1 .3.3.4.6.4 1 0 .4-.6.6-2.4.6z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="8" cy="11" r="1.1" />
        <circle cx="12" cy="8.5" r="1.1" />
        <circle cx="16" cy="11" r="1.1" />
      </>
    ),
  },
  {
    titre: "Projection murale",
    texte: "Un mode veilleuse qui projette les illustrations au plafond, pour s'endormir dans l'histoire.",
    icone: (
      <>
        <rect x="3" y="9" width="8" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 10.5l9-3v9l-9-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="6.5" cy="12" r="1" />
      </>
    ),
  },
  {
    titre: "Histoire audio",
    texte: "La voix qui raconte, en MP3, pour les trajets en voiture et les yeux déjà fermés.",
    icone: (
      <>
        <path d="M4 10v4h3l4 3V7L7 10H4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M15 9.5a3.5 3.5 0 010 5M17.5 7a7 7 0 010 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    titre: "Poster du héros",
    texte: "Le portrait du héros en grand format, à afficher fièrement au-dessus du lit.",
    icone: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.5 15l3-3.5 2.5 2.5 2-2.5 1.5 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="10" cy="8" r="1.3" />
      </>
    ),
  },
];

export default function AccueilPage() {
  return (
    <div className="space-y-24">
      {/* ─── Héros : la nuit où commence l'histoire ─── */}
      <section
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-12 shadow-conte ring-1 ring-white/10 sm:px-12 sm:py-16"
        style={{
          backgroundImage:
            "radial-gradient(70% 55% at 82% 20%, rgba(154,122,224,.45), rgba(154,122,224,0) 60%), radial-gradient(60% 50% at 10% 92%, rgba(57,165,143,.28), rgba(57,165,143,0) 60%), linear-gradient(180deg,#171338,#1b1544 55%,#15103a)",
        }}
      >
        {/* Ciel étoilé */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1200 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <g fill="#ffffff">
            <circle className="anim-scintille" cx="120" cy="90" r="1.8" />
            <circle cx="300" cy="150" r="1.1" opacity=".5" />
            <circle className="anim-scintille" cx="520" cy="80" r="1.4" style={{ animationDelay: "0.6s" }} />
            <circle cx="760" cy="120" r="1.2" opacity=".5" />
            <circle className="anim-scintille" cx="980" cy="70" r="1.6" style={{ animationDelay: "1.2s" }} />
            <circle cx="1120" cy="160" r="1.2" opacity=".5" />
            <circle className="anim-scintille" cx="200" cy="320" r="1.3" style={{ animationDelay: "1.8s" }} />
            <circle cx="1060" cy="330" r="1.3" opacity=".55" />
          </g>
          <g transform="translate(1080,110)">
            <circle r="30" fill="#f6e7c4" />
            <circle cx="10" cy="-5" r="25" fill="#171338" />
          </g>
          <Etoile className="h-6 w-6" style={{ color: "#f6d79a", transform: "translate(250px,330px)" }} />
        </svg>

        {/* Poussière d'étoiles flottante */}
        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
          <Etoile className="anim-scintille absolute h-3 w-3 text-or-clair" style={{ top: "16%", left: "30%" }} />
          <Etoile className="anim-scintille absolute h-4 w-4 text-or" style={{ top: "70%", left: "8%", animationDelay: "1.1s" }} />
          <Etoile className="anim-scintille absolute h-3 w-3 text-magique-rose" style={{ top: "30%", right: "16%", animationDelay: "0.5s" }} />
          <Etoile className="anim-scintille absolute h-2.5 w-2.5 text-or-clair" style={{ bottom: "14%", right: "26%", animationDelay: "1.7s" }} />
          <span className="anim-derive absolute h-1.5 w-1.5 rounded-full bg-or-clair" style={{ bottom: "20%", left: "44%" }} />
          <span className="anim-derive absolute h-1 w-1 rounded-full bg-or" style={{ bottom: "24%", left: "56%", animationDelay: "2s" }} />
          <span className="anim-derive absolute h-1.5 w-1.5 rounded-full bg-white/80" style={{ bottom: "16%", left: "64%", animationDelay: "3.5s" }} />
          <span className="anim-derive absolute h-1 w-1 rounded-full bg-or-clair" style={{ bottom: "28%", left: "36%", animationDelay: "5s" }} />
        </div>

        <div className="relative z-10 grid items-center gap-8 sm:gap-10 md:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 flex" style={{ animation: "eclore .8s .05s both" }}>
              <LogoMark className="h-14 w-14 drop-shadow-md anim-flotte" />
            </div>
            <p
              className="flex items-center gap-2 font-serif text-[15px] italic text-or-clair"
              style={{ animation: "monter .6s .08s both" }}
            >
              <Etoile className="h-3.5 w-3.5 text-or" />
              Une histoire unique, écrite pour votre enfant
            </p>
            <h1
              className="mt-4 text-4xl leading-[1.05] text-white sm:text-6xl"
              style={{ animation: "monter .6s .16s both" }}
            >
              Il était une fois…
              <br />
              <span className="text-gradient italic">votre enfant.</span>
            </h1>
            <p
              className="mt-5 max-w-[34ch] text-lg leading-relaxed text-[#dcd6f4]"
              style={{ animation: "monter .6s .24s both" }}
            >
              Un prénom, quelques traits — et, si vous le souhaitez, une photo. Nous
              écrivons un conte doux à l'image de votre enfant, parfait pour le
              rituel du soir et à écouter à voix haute.
            </p>
            <div className="mt-8 flex flex-wrap gap-4" style={{ animation: "monter .6s .32s both" }}>
              <Link href="/connexion" className="btn-primaire">
                Créer notre histoire
              </Link>
              <Link
                href="/cgu"
                className="btn-secondaire border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              >
                En savoir plus
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2" style={{ animation: "monter .6s .4s both" }}>
              <Gage>Héros 100% originaux</Gage>
              <Gage>Photo jamais stockée</Gage>
              <Gage>Conforme RGPD</Gage>
            </div>
          </div>

          {/* Le livre d'où s'échappe un monde (illustration, profondeur 3D) */}
          <div className="relative mx-auto max-w-sm md:max-w-none" style={{ animation: "eclore .9s .2s both" }}>
            <Tilt3D>
              <div
                className="halo-pulse pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(50% 45% at 50% 46%, rgba(246,215,154,.5), rgba(246,215,154,0) 70%)",
                }}
                aria-hidden="true"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/hero.webp"
                alt="Un livre ouvert d'où s'élève un château enchanté sous un ciel étoilé"
                className="anim-flotte relative w-full rounded-[2rem] shadow-conte"
              />
              {/* Ombre au sol : ancre l'objet, renforce la 3D */}
              <div
                className="pointer-events-none absolute -bottom-5 left-1/2 h-6 w-2/3 -translate-x-1/2 rounded-[50%]"
                style={{ background: "radial-gradient(50% 100% at 50% 0, rgba(0,0,0,.4), transparent 72%)", filter: "blur(7px)" }}
                aria-hidden="true"
              />
            </Tilt3D>
          </div>
        </div>
      </section>

      {/* ─── Comment naît le conte (une vraie séquence : chapitres) ─── */}
      <section>
        <header className="text-center">
          <h2 className="text-3xl sm:text-4xl">Comment naît votre conte ?</h2>
          <Ornement />
          <p className="mx-auto max-w-[46ch] text-magique-texteClair">
            Pas de compte compliqué, pas de photo imposée. Juste un peu
            d'imagination et quelques secondes de patience.
          </p>
        </header>
        <div className="relative mt-12">
          {/* Fil doré qui relie les trois chapitres (desktop) */}
          <div
            className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-[34px] hidden border-t-2 border-dashed border-or/40 sm:block"
            aria-hidden="true"
          />
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                num: "I",
                titre: "Vous imaginez",
                texte:
                  "Le prénom et l'âge de l'enfant, puis un héros original ou votre propre idée d'aventure.",
              },
              {
                num: "II",
                titre: "La plume s'anime",
                texte:
                  "Une histoire douce et illustrée s'écrit en moins d'une minute, avec une fin rassurante.",
              },
              {
                num: "III",
                titre: "Vous lisez ensemble",
                texte:
                  "Page par page, avec lecture à voix haute. Puis un joli PDF à imprimer et à garder.",
              },
            ].map((c) => (
              <article key={c.num} data-tilt className="carte-relief p-7 text-center">
                <div
                  className="relief-avant mx-auto flex h-16 w-16 items-center justify-center rounded-full font-serif text-2xl text-white shadow-or"
                  style={{ backgroundImage: "linear-gradient(160deg,#9a5ae0,#6d28d9)" }}
                >
                  {c.num}
                </div>
                <p className="relief-milieu mt-4 font-serif italic text-or-fonce">Chapitre {c.num}</p>
                <h3 className="relief-milieu mt-1 text-xl">{c.titre}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-magique-texteClair">
                  {c.texte}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Les petits plus qui changent tout ─── */}
      <section>
        <header className="text-center">
          <h2 className="text-3xl sm:text-4xl">Bien plus qu'un simple livre</h2>
          <Ornement />
          <p className="mx-auto max-w-[48ch] text-magique-texteClair">
            Chaque histoire se prolonge au-delà de la page, pour vivre dans la
            chambre bien après le mot « fin ».
          </p>
        </header>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {EXTRAS.map((e) => (
            <article key={e.titre} data-tilt className="carte-relief flex items-start gap-5 p-7">
              <span className="relief-avant flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-magique-primaire/10 text-magique-primaire">
                <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
                  {e.icone}
                </svg>
              </span>
              <div>
                <h3 className="relief-milieu text-xl">{e.titre}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-magique-texteClair">
                  {e.texte}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Garanties : un bandeau de réassurance (forme différente des cartes) ─── */}
      <section className="carte-relief overflow-hidden p-8 sm:p-10">
        <header className="text-center">
          <h2 className="text-2xl sm:text-3xl">Pensé pour rassurer les parents</h2>
          <Ornement />
        </header>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          {[
            {
              titre: "Personnages originaux",
              texte:
                "Uniquement des héros créés pour l'application. Jamais de personnage sous droits.",
            },
            {
              titre: "Photo protégée",
              texte:
                "La photo reste optionnelle, privée, supprimable, et jamais utilisée pour entraîner l'IA.",
            },
            {
              titre: "Consentement parental",
              texte:
                "Chaque création exige le consentement explicite d'un parent. Données conformes au RGPD.",
            },
          ].map((g) => (
            <div key={g.titre} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-magique-accent/15 text-magique-accent">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <h3 className="text-lg">{g.titre}</h3>
              <p className="max-w-[32ch] text-sm leading-relaxed text-magique-texteClair">
                {g.texte}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Extrait en double page ─── */}
      <section className="carte overflow-hidden !p-0">
        <div className="p-8 text-center sm:p-10">
          <h2 className="text-3xl">« Sami et Lila dans la forêt enchantée »</h2>
          <Ornement />
          <p className="text-magique-texteClair">Un extrait, comme vous le liriez à la maison.</p>
        </div>
        <div className="grid gap-px bg-magique-trait sm:grid-cols-2">
          <div className="bg-parch p-8 text-lg leading-relaxed sm:p-10">
            <span className="float-left pr-3 font-serif text-5xl leading-[0.8] text-or-fonce">A</span>
            u cœur de la forêt enchantée, Sami et Lila la renarde suivent un petit
            champignon qui brille comme une lanterne. « Suis-moi », chuchote Lila,
            « il connaît le chemin. »
          </div>
          <div className="bg-white p-8 text-lg leading-relaxed sm:p-10">
            Guidés par les lucioles, ils trouvent une clairière scintillante. À la
            tombée du soir, Sami rentre se coucher, le cœur tout content et la tête
            pleine d'étoiles.
          </div>
        </div>
        <div className="p-8 text-center">
          <Link href="/connexion" className="btn-primaire">
            Créer l'histoire de mon enfant
          </Link>
        </div>
      </section>
    </div>
  );
}
