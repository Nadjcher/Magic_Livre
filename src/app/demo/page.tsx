/**
 * Démo publique : un livre exemple lisible par tous, sans compte. Montre le
 * lecteur (pages, illustrations, lecture à voix haute, mode projection) pour
 * donner un aperçu du « waw » avant de créer son propre conte.
 */

import Link from "next/link";
import type { Metadata } from "next";
import type { Story } from "@/lib/storySchema";
import BookReader from "@/components/BookReader";

export const metadata: Metadata = {
  title: "Un aperçu de la magie",
  description:
    "Feuilletez un exemple de conte personnalisé : illustrations, lecture à voix haute et mode projection. Sans compte.",
};

/** Livre-démo (contenu d'exemple, illustrations fournies avec le site). */
const DEMO: Story = {
  titre: "La nuit où le livre s'est allumé",
  couvertureUrl: "/illustrations/feerique/hero.webp",
  style: "feerique",
  pages: [
    {
      texte:
        "Ce soir-là, Lina n'avait pas du tout sommeil. À peine ouvrit-elle son livre qu'un petit château et un dragon farceur jaillirent d'un nuage, juste au-dessus de son lit.",
      scene_illustration: "Une enfant imagine un château et un dragon au-dessus de son lit.",
      imageUrl: "/illustrations/feerique/imagine.webp",
    },
    {
      texte:
        "Une plume dorée se mit à écrire toute seule sur les pages. « C'est TON histoire », chuchota-t-elle, et chaque mot scintillait comme une étoile filante.",
      scene_illustration: "Un livre magique dont une plume d'or écrit toute seule.",
      imageUrl: "/illustrations/feerique/write.webp",
    },
    {
      texte:
        "Maman vint se blottir tout près. Ensemble, elles suivirent Lina et le dragon à travers la forêt des lucioles, de clairière en clairière.",
      scene_illustration: "Un parent et un enfant lisent le conte, blottis l'un contre l'autre.",
      imageUrl: "/illustrations/feerique/together.webp",
    },
    {
      texte:
        "À la toute dernière page, le dragon souffla une pluie d'étoiles. Lina ferma les yeux, le cœur tout chaud, et s'endormit paisiblement dans son histoire.",
      scene_illustration: "L'enfant s'endort au lit sous la lune et les étoiles.",
      imageUrl: "/illustrations/feerique/nuit.webp",
    },
  ],
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
        <h1 className="mt-1 text-3xl sm:text-4xl">Feuilletez la magie</h1>
        <p className="mx-auto mt-3 max-w-[48ch] text-magique-texteClair">
          Voici un exemple de conte. Tournez les pages, écoutez la lecture à voix
          haute, essayez le mode projection. Puis imaginez la même chose… à
          l'image de votre enfant.
        </p>
      </header>

      <BookReader story={DEMO} />

      {/* Appel à l'action : passer à son propre conte */}
      <section
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-12 text-center shadow-conte ring-1 ring-white/10 sm:px-12"
        style={{
          backgroundImage:
            "radial-gradient(60% 60% at 50% 0%, rgba(154,122,224,.45), rgba(154,122,224,0) 60%), linear-gradient(180deg,#1b1544,#15103a)",
        }}
      >
        <h2 className="text-2xl text-white sm:text-3xl">
          Et si la prochaine histoire parlait de <span className="text-gradient italic">votre enfant&nbsp;?</span>
        </h2>
        <p className="mx-auto mt-3 max-w-[40ch] text-[#dcd6f4]">
          Son prénom, ses couleurs, son petit héros. Lecture gratuite à l'écran ;
          le PDF à imprimer, la version audio et le poster en option.
        </p>
        <div className="mt-7 flex justify-center">
          <Link href="/connexion" className="btn-primaire text-lg">
            Créer notre histoire
          </Link>
        </div>
      </section>
    </div>
  );
}
