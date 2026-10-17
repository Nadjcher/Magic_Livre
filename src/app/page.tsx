/**
 * Page d'accueil « conte enchanté » : héros nuit étoilée avec livre lumineux,
 * chapitres, garanties, et un extrait en double page.
 */

import Link from "next/link";
import { LogoMark } from "@/components/Logo";

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

export default function AccueilPage() {
  return (
    <div className="space-y-20">
      {/* ─── Héros : la nuit où commence l'histoire ─── */}
      <section
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-12 ring-1 ring-white/10 sm:px-12 sm:py-16"
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
              className="mt-5 max-w-[32ch] text-lg leading-relaxed text-[#dcd6f4]"
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
          </div>

          {/* Le livre d'où s'échappe un monde (illustration) */}
          <div className="relative mx-auto max-w-sm md:max-w-none" style={{ animation: "eclore .9s .2s both" }}>
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
          </div>
        </div>
      </section>

      {/* ─── Comment naît le conte ─── */}
      <section>
        <header className="text-center">
          <h2 className="text-3xl sm:text-4xl">Comment naît votre conte ?</h2>
          <Ornement />
          <p className="mx-auto max-w-[46ch] text-magique-texteClair">
            Pas de compte compliqué, pas de photo imposée. Juste un peu
            d'imagination et quelques secondes de patience.
          </p>
        </header>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              chap: "Chapitre I",
              titre: "Vous imaginez",
              texte:
                "Le prénom et l'âge de l'enfant, puis un héros original ou votre propre idée d'aventure.",
            },
            {
              chap: "Chapitre II",
              titre: "La plume s'anime",
              texte:
                "Une histoire douce et illustrée s'écrit en moins d'une minute, avec une fin rassurante.",
            },
            {
              chap: "Chapitre III",
              titre: "Vous lisez ensemble",
              texte:
                "Page par page, avec lecture à voix haute. Puis un joli PDF à imprimer et à garder.",
            },
          ].map((c) => (
            <article key={c.chap} className="carte carte-interactive">
              <p className="font-serif italic text-or-fonce">{c.chap}</p>
              <h3 className="mt-1 text-xl">{c.titre}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-magique-texteClair">
                {c.texte}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Garanties ─── */}
      <section>
        <header className="text-center">
          <h2 className="text-3xl sm:text-4xl">Pensé pour rassurer les parents</h2>
          <Ornement />
        </header>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
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
            <article key={g.titre} className="carte carte-interactive flex gap-3">
              <Etoile className="mt-1 h-5 w-5 shrink-0 text-or" />
              <div>
                <h3 className="text-lg">{g.titre}</h3>
                <p className="mt-1 text-sm leading-relaxed text-magique-texteClair">
                  {g.texte}
                </p>
              </div>
            </article>
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

