/**
 * Page d'accueil : présentation, garanties et exemple de livre.
 */

import Link from "next/link";

export default function AccueilPage() {
  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-magique-primaire sm:text-5xl">
          Des livres magiques, rien que pour votre enfant
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-magique-texteClair">
          Saisissez le prénom de votre enfant, choisissez un héros original ou
          imaginez une aventure, et recevez une jolie histoire de 8 à 12 pages,
          à lire ensemble et à écouter à voix haute.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/connexion" className="btn-primaire">
            Commencer
          </Link>
          <Link href="/cgu" className="btn-secondaire">
            En savoir plus
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <div className="carte text-center">
          <div className="text-3xl">🦊</div>
          <h2 className="mt-2 font-semibold">Personnages originaux</h2>
          <p className="mt-2 text-sm text-magique-texteClair">
            Uniquement des héros créés pour l'application. Aucun personnage sous
            droits n'est utilisé.
          </p>
        </div>
        <div className="carte text-center">
          <div className="text-3xl">📷🚫</div>
          <h2 className="mt-2 font-semibold">Aucune photo demandée</h2>
          <p className="mt-2 text-sm text-magique-texteClair">
            Nous ne demandons jamais de photo de votre enfant. Seuls le prénom et
            l'âge sont utilisés.
          </p>
        </div>
        <div className="carte text-center">
          <div className="text-3xl">✅</div>
          <h2 className="mt-2 font-semibold">Consentement parental</h2>
          <p className="mt-2 text-sm text-magique-texteClair">
            Chaque création nécessite le consentement explicite d'un parent ou
            représentant légal.
          </p>
        </div>
      </section>

      <section className="carte">
        <h2 className="text-2xl font-bold text-magique-primaire">Exemple de livre</h2>
        <p className="mt-2 text-magique-texteClair">
          « L'aventure de Sami à la boulangerie »
        </p>
        <blockquote className="mt-4 rounded-xl bg-magique-fond p-4 text-lg leading-relaxed">
          Ce matin, Sami part acheter le pain. En chemin, il rencontre un petit
          chat perdu. Ensemble, ils vivent une drôle d'aventure et rentrent à la
          maison, le cœur tout content.
        </blockquote>
      </section>
    </div>
  );
}
