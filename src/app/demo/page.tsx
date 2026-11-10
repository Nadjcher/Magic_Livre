/**
 * Démo publique : un livre exemple lisible par tous, sans compte. Montre le
 * lecteur (pages, illustrations, lecture à voix haute) pour
 * donner un aperçu du « waw » avant de créer son propre conte.
 */

import Link from "next/link";
import type { Metadata } from "next";
import type { Story } from "@/lib/storySchema";
import BookReader from "@/components/BookReader";

export const metadata: Metadata = {
  alternates: { canonical: "/demo" },
  title: "Un aperçu de la magie",
  description:
    "Feuilletez un exemple de conte personnalisé : illustrations et lecture à voix haute. Sans compte.",
};

/** Livre-démo : un vrai livre créé par le site à partir de la photo d'exemple de Léo (enfant fictif). */
const DEMO: Story = {
  titre: "Le hoquet doré de la nuit de Noël",
  couvertureUrl: "/exemple/noel/couverture.webp",
  style: "anim3d",
  pages: [
    {
      texte: "C'est la veille de Noël, et Léo n'arrive pas à dormir. Dehors, la neige tombe en gros flocons tout doux. Soudain, un drôle de bruit monte du jardin : « Hic ! »",
      scene_illustration: "Illustration de la page 1 du livre de Léo.",
      imageUrl: "/exemple/noel/00.webp",
    },
    {
      texte: "Léo enfile ses bottes et sort sur la pointe des pieds. Au milieu de la neige, un petit renne doré saute comme une balle. « Hic ! » fait-il, et hop, il rebondit encore !",
      scene_illustration: "Illustration de la page 2 du livre de Léo.",
      imageUrl: "/exemple/noel/01.webp",
    },
    {
      texte: "Un lutin minuscule arrive en courant et en agitant ses moufles. « Je suis Pépin, et lui, c'est Caramel ! Il a mangé trop de sucres d'orge glacés, et sans lui, le traîneau du Père Noël ne peut pas partir ! »",
      scene_illustration: "Illustration de la page 3 du livre de Léo.",
      imageUrl: "/exemple/noel/02.webp",
    },
    {
      texte: "Léo se cache derrière un buisson et crie très fort : « BOUH ! » Caramel éclate de rire et… « Hic ! » Et hop, le voilà perché sur le toit de la cabane !",
      scene_illustration: "Illustration de la page 4 du livre de Léo.",
      imageUrl: "/exemple/noel/03.webp",
    },
    {
      texte: "Pépin soupire, et Léo réfléchit très fort. Des bonbons glacés, ça refroidit le ventre… Et quand Léo a froid, Maman lui donne toujours quelque chose de chaud !",
      scene_illustration: "Illustration de la page 5 du livre de Léo.",
      imageUrl: "/exemple/noel/04.webp",
    },
    {
      texte: "Léo court jusqu'au sapin, où attend la tasse de lait à la cannelle préparée pour le Père Noël. Il hésite un tout petit peu… puis il la prend dans ses mains. « Le Père Noël comprendra », se dit-il, tout généreux.",
      scene_illustration: "Illustration de la page 6 du livre de Léo.",
      imageUrl: "/exemple/noel/05.webp",
    },
    {
      texte: "Caramel boit le lait chaud, gorgée après gorgée. Son ventre se réchauffe, ses bois dorés se mettent à briller… et plus aucun hic ! Pépin danse de joie dans la neige.",
      scene_illustration: "Illustration de la page 7 du livre de Léo.",
      imageUrl: "/exemple/noel/06.webp",
    },
    {
      texte: "Un traîneau tout scintillant attend au bout du jardin. « C'est toi qui donnes le départ ! » dit Pépin. Léo, tout fier, crie : « En route ! », et Caramel s'envole au-dessus du village enneigé.",
      scene_illustration: "Illustration de la page 8 du livre de Léo.",
      imageUrl: "/exemple/noel/07.webp",
    },
    {
      texte: "Au matin, sous le sapin, la tasse est de nouveau pleine, et à côté brille un tout petit grelot doré. Léo le secoue doucement… « Hic ! » fait le grelot. Léo éclate de rire : cette nuit, c'est lui qui a fait briller la magie de Noël !",
      scene_illustration: "Illustration de la page 9 du livre de Léo.",
      imageUrl: "/exemple/noel/08.webp",
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
        <h1 className="mt-1 text-3xl sm:text-4xl">Le livre de Léo, 5 ans</h1>
        <p className="mx-auto mt-3 max-w-[50ch] text-magique-texteClair">
          Un vrai livre créé par le site à partir d'une seule photo. Tournez les pages, écoutez la lecture à voix
          haute. Le même, avec votre enfant en héros.
        </p>
        <figure className="mx-auto mt-6 w-32 rotate-[-4deg] rounded-md bg-white p-1.5 pb-6 shadow-conte">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/exemple/photo.webp" alt="La photo envoyée" width={240} height={320} className="aspect-[3/4] w-full rounded-sm object-cover" />
          <figcaption className="mt-1 font-serif text-xs italic text-nuit">La photo envoyée</figcaption>
        </figure>
        <p className="mt-3 text-xs text-magique-texteClair">Exemple réalisé avec un enfant fictif.</p>
      </header>

      <BookReader story={DEMO} prenom="Léo" />

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
            Créer son histoire
          </Link>
        </div>
      </section>
    </div>
  );
}
