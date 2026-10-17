"use client";

/**
 * Overlay affiché pendant la génération d'un livre : un livre qui luit, des
 * étoiles en orbite, une barre chatoyante et des messages qui se succèdent.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "./Logo";

const MESSAGES = [
  "On ouvre le grand livre…",
  "La plume s'anime…",
  "On saupoudre un peu d'étoiles…",
  "Les personnages prennent vie…",
  "On dessine les illustrations…",
  "Encore quelques secondes de magie…",
];

export default function GenerationOverlay() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % MESSAGES.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
      style={{
        backgroundImage:
          "radial-gradient(60% 50% at 50% 40%, rgba(154,122,224,.45), rgba(154,122,224,0) 60%), linear-gradient(180deg,#171338,#15103a)",
      }}
      role="status"
      aria-live="polite"
    >
      {/* Livre lumineux + étoiles en orbite */}
      <div className="relative h-40 w-40">
        <div
          className="halo-pulse absolute inset-0"
          style={{
            background: "radial-gradient(circle, rgba(246,215,154,.5), rgba(246,215,154,0) 70%)",
          }}
        />
        <div className="anim-orbite absolute inset-0">
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-or-clair" />
          <span className="absolute bottom-2 right-3 h-1.5 w-1.5 rounded-full bg-white/80" />
          <span className="absolute bottom-3 left-3 h-1.5 w-1.5 rounded-full bg-magique-rose" />
        </div>
        <div className="anim-flotte absolute inset-0 flex items-center justify-center">
          <LogoMark className="h-20 w-20 drop-shadow-[0_0_18px_rgba(233,169,75,.6)]" />
        </div>
      </div>

      <h2 className="mt-8 font-serif text-2xl text-white">Votre conte s'écrit…</h2>
      <p className="mt-2 h-6 text-[#dcd6f4] transition-all">{MESSAGES[i]}</p>

      {/* Barre chatoyante (progression indéterminée) */}
      <div className="mt-6 h-2 w-64 max-w-[80vw] overflow-hidden rounded-full bg-white/10">
        <div
          className="anim-balaie h-full w-full rounded-full"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(233,169,75,0), #f0b863 45%, #f6d79a 50%, #f0b863 55%, rgba(233,169,75,0))",
          }}
        />
      </div>

      <Link href="/bibliotheque" className="mt-8 text-sm text-[#bcb4e4] underline hover:text-white">
        Revenir à ma bibliothèque pendant ce temps
      </Link>
    </div>
  );
}
