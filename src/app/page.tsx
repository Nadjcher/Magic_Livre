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
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-16 sm:px-12"
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
            <circle cx="120" cy="90" r="1.6" opacity=".7" />
            <circle cx="300" cy="150" r="1.1" opacity=".5" />
            <circle cx="520" cy="80" r="1.3" opacity=".6" />
            <circle cx="760" cy="120" r="1.2" opacity=".5" />
            <circle cx="980" cy="70" r="1.5" opacity=".7" />
            <circle cx="1120" cy="160" r="1.2" opacity=".5" />
            <circle cx="200" cy="320" r="1.2" opacity=".5" />
            <circle cx="1060" cy="330" r="1.3" opacity=".55" />
          </g>
          <g transform="translate(1080,110)">
            <circle r="30" fill="#f6e7c4" />
            <circle cx="10" cy="-5" r="25" fill="#171338" />
          </g>
          <Etoile className="h-6 w-6" style={{ color: "#f6d79a", transform: "translate(250px,330px)" }} />
        </svg>

        <div className="relative z-10 grid items-center gap-10 md:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 flex" style={{ animation: "eclore 1s .1s both" }}>
              <LogoMark className="h-14 w-14 drop-shadow-md anim-flotte" />
            </div>
            <p
              className="flex items-center gap-2 font-serif text-[15px] italic text-or-clair"
              style={{ animation: "monter .8s .2s both" }}
            >
              <Etoile className="h-3.5 w-3.5 text-or" />
              Une histoire unique, écrite pour votre enfant
            </p>
            <h1
              className="mt-4 text-4xl leading-[1.05] text-white sm:text-6xl"
              style={{ animation: "monter .8s .35s both" }}
            >
              Il était une fois…
              <br />
              <span className="text-gradient italic">votre enfant.</span>
            </h1>
            <p
              className="mt-5 max-w-[32ch] text-lg leading-relaxed text-[#dcd6f4]"
              style={{ animation: "monter .8s .5s both" }}
            >
              Un prénom, quelques traits — et, si vous le souhaitez, une photo. Nous
              écrivons un conte doux à l'image de votre enfant, parfait pour le
              rituel du soir et à écouter à voix haute.
            </p>
            <div className="mt-8 flex flex-wrap gap-4" style={{ animation: "monter .8s .65s both" }}>
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

          {/* Le livre d'où s'échappe un monde */}
          <div className="relative" style={{ animation: "eclore 1s .4s both" }}>
            <HeroBook />
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

/** Illustration du héros : livre ouvert, halo, monde qui s'élève. */
function HeroBook() {
  return (
    <svg viewBox="0 0 480 440" className="w-full" aria-hidden="true">
      <defs>
        <radialGradient id="halo" cx="50%" cy="44%" r="55%">
          <stop offset="0" stopColor="#f6d79a" stopOpacity=".9" />
          <stop offset="100%" stopColor="#f6d79a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tour" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9a6f0" />
          <stop offset="1" stopColor="#8f79d6" />
        </linearGradient>
      </defs>
      <ellipse cx="240" cy="250" rx="220" ry="190" fill="url(#halo)" />

      {/* spirale de poussière d'étoiles */}
      <path
        d="M240 250 C150 220 150 130 250 120 C340 112 350 58 262 44"
        fill="none"
        stroke="#f3cd8f"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity=".7"
        strokeDasharray="2 10"
      />
      {/* château flottant */}
      <g transform="translate(250,86)">
        <rect x="-34" y="0" width="68" height="30" rx="3" fill="url(#tour)" />
        <rect x="-34" y="-20" width="12" height="20" fill="url(#tour)" />
        <rect x="-6" y="-26" width="12" height="26" fill="url(#tour)" />
        <rect x="22" y="-20" width="12" height="20" fill="url(#tour)" />
        <path d="M-28 -20 l6 -8 6 8z M0 -26 l6 -8 6 8z M28 -20 l6 -8 6 8z" fill="#f0b863" />
      </g>
      {/* planète à anneau */}
      <g transform="translate(336,150)">
        <circle r="16" fill="#7aa8e8" />
        <ellipse cx="-5" cy="-4" rx="7" ry="4" fill="#9fd0b0" />
        <ellipse rx="26" ry="8" fill="none" stroke="#f3cd8f" strokeWidth="2.2" transform="rotate(-20)" />
      </g>
      {/* ombre + livre */}
      <ellipse cx="240" cy="378" rx="150" ry="15" fill="#0a0820" opacity=".3" />
      <g transform="translate(240,300)">
        <path d="M0 -36 C-48 -66 -128 -66 -176 -36 L-176 70 C-128 40 -48 40 0 70 Z" fill="#fffdf7" stroke="#e6dcc4" />
        <path d="M0 -36 C48 -66 128 -66 176 -36 L176 70 C128 40 48 40 0 70 Z" fill="#fbeccd" stroke="#e6dcc4" />
        <path d="M0 -36 L0 70" stroke="#caa15f" strokeWidth="2" />
        <g stroke="#d9c79b" strokeWidth="4" strokeLinecap="round" opacity=".8">
          <path d="M-150 -28 L-34 -28" />
          <path d="M-150 -4 L-34 -4" />
          <path d="M-150 20 L-56 20" />
          <path d="M34 -28 L150 -28" />
          <path d="M34 -4 L150 -4" />
          <path d="M56 20 L150 20" />
        </g>
      </g>
      {/* renard conteur */}
      <g transform="translate(104,300)">
        <ellipse cx="0" cy="24" rx="26" ry="22" fill="#e0763f" />
        <path d="M-20 6 l-8 -22 16 8z M20 6 l8 -22 -16 8z" fill="#e0763f" />
        <ellipse cx="0" cy="30" rx="13" ry="11" fill="#fbeccd" />
        <circle cx="-8" cy="20" r="2.6" fill="#2a2443" />
        <circle cx="8" cy="20" r="2.6" fill="#2a2443" />
        <circle cx="0" cy="28" r="2.4" fill="#2a2443" />
      </g>
    </svg>
  );
}
