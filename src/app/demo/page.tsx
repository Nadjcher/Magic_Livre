/**
 * Démo publique : un livre exemple lisible par tous, sans compte. Montre le
 * lecteur (pages, illustrations, lecture à voix haute) pour
 * donner un aperçu du « waw » avant de créer son propre conte.
 */

import Link from "next/link";
import type { Metadata } from "next";
import type { Story } from "@/lib/storySchema";
import BookReader from "@/components/BookReader";
import { LIVRE_VITRINE } from "@/lib/livreVitrine";

export const metadata: Metadata = {
  alternates: { canonical: "/demo" },
  title: "Un aperçu de la magie",
  description:
    "Feuilletez un exemple de conte personnalisé : illustrations et lecture à voix haute. Sans compte.",
};

/** Livre-démo : « La petite lueur de Léo », le livre de la page d'accueil (enfant fictif). */
const DEMO: Story = {
  titre: LIVRE_VITRINE.titre,
  couvertureUrl: LIVRE_VITRINE.couverture,
  style: "anim3d",
  pages: LIVRE_VITRINE.pages.map((p, k) => ({
    texte: p.texte,
    scene_illustration: `Illustration de la page ${k + 1} du livre de Léo.`,
    imageUrl: p.image,
  })),
};

export default function DemoPage() {
  return (
    <div className="space-y-10">
      <header className="text-center">
        <p className="flex items-center justify-center gap-2 font-serif italic text-or-fonce">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-or" fill="currentColor" aria-hidden="true">
            <path d="M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z" />
          </svg>
          Un aperçu, sans compte
        </p>
        <h1 className="mt-1 text-3xl sm:text-4xl">La petite lueur de Léo, 4 ans</h1>
        <p className="mx-auto mt-3 max-w-[50ch] text-magique-texteClair">
          Écrit pour un petit garçon qui a peur quand sa veilleuse s'éteint, et dessiné d'après une seule photo. Tournez les
          pages, écoutez la lecture à voix haute. Le même, avec votre enfant en héros.
        </p>
        <figure className="mx-auto mt-6 w-32 rotate-[-4deg] rounded-md bg-white p-1.5 pb-6 shadow-conte">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/exemple/photo.webp" alt="La photo envoyée" width={240} height={320} className="aspect-[3/4] w-full rounded-sm object-cover" />
          <figcaption className="mt-1 font-serif text-xs italic text-nuit">La photo envoyée</figcaption>
        </figure>
        <p className="mt-3 text-xs text-magique-texteClair">Exemple réalisé avec un enfant fictif.</p>
      </header>

      <BookReader story={DEMO} prenom="Léo" carre />

      {/* Appel à l'action : passer à son propre conte */}
      <section
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-12 text-center shadow-conte ring-1 ring-white/10 sm:px-12"
        style={{
          backgroundImage:
            "linear-gradient(180deg,#16245c,#0f1a44)",
        }}
      >
        <h2 className="text-2xl text-white sm:text-3xl">
          Et si la prochaine histoire parlait de <span className="italic text-or-clair">votre enfant&nbsp;?</span>
        </h2>
        <p className="mx-auto mt-3 max-w-[40ch] text-magique-texteClair">
          Son prénom, son visage, son histoire. Lecture gratuite à l'écran ;
          le PDF à imprimer, la lecture à voix haute, le dessin animé et l'affiche en option.
        </p>
        <div className="mt-7 flex justify-center">
          <Link href="/creer" className="btn-primaire text-lg">
            Créer son livre gratuitement
          </Link>
        </div>
      </section>
    </div>
  );
}
