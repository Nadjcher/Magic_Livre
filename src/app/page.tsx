/**
 * Page d'accueil : présentation, garanties, étapes et exemple de livre.
 * Mise en page « magique » : halos, étoiles scintillantes et emojis flottants.
 */

import Link from "next/link";
import { LogoMark } from "@/components/Logo";

/** Petit emoji décoratif flottant, positionné en absolu. */
function EmojiFlottant({
  children,
  className,
  delay = "0s",
}: {
  children: React.ReactNode;
  className: string;
  delay?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute select-none text-3xl anim-flotte sm:text-4xl ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </span>
  );
}

export default function AccueilPage() {
  return (
    <div className="space-y-16">
      {/* Héros */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/50 px-6 py-16 text-center shadow-sm backdrop-blur-sm">
        {/* Décor flottant */}
        <EmojiFlottant className="left-6 top-10" delay="0s">
          🦊
        </EmojiFlottant>
        <EmojiFlottant className="right-8 top-14" delay="1.2s">
          🚀
        </EmojiFlottant>
        <EmojiFlottant className="bottom-10 left-12" delay="0.6s">
          🐲
        </EmojiFlottant>
        <EmojiFlottant className="bottom-12 right-10" delay="1.8s">
          🧜
        </EmojiFlottant>
        <span aria-hidden className="absolute left-1/4 top-6 text-xl anim-scintille">
          ✨
        </span>
        <span
          aria-hidden
          className="absolute right-1/4 bottom-8 text-xl anim-scintille"
          style={{ animationDelay: "1.5s" }}
        >
          ⭐
        </span>

        <div className="relative mx-auto max-w-2xl">
          <div className="mx-auto mb-6 flex justify-center">
            <LogoMark className="h-16 w-16 drop-shadow-md anim-flotte" />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-magique-primaire/10 px-4 py-1 text-sm font-semibold text-magique-primaire">
            ✨ Des histoires uniques, créées pour votre enfant
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            <span className="text-gradient">Des livres magiques,</span>
            <br />
            rien que pour votre enfant
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-magique-texteClair">
            Saisissez le prénom de votre enfant, choisissez un héros original ou
            imaginez une aventure, et recevez une jolie histoire de 8 à 12 pages,
            à lire ensemble et à écouter à voix haute.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/connexion" className="btn-primaire">
              ✨ Commencer l'aventure
            </Link>
            <Link href="/cgu" className="btn-secondaire">
              En savoir plus
            </Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section>
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          <span className="text-gradient">Comment ça marche ?</span>
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              num: "1",
              emoji: "✏️",
              titre: "Vous personnalisez",
              texte:
                "Prénom, âge, et un héros original ou votre propre idée d'aventure.",
            },
            {
              num: "2",
              emoji: "🪄",
              titre: "La magie opère",
              texte:
                "Une histoire douce et illustrée se crée en moins d'une minute.",
            },
            {
              num: "3",
              emoji: "📖",
              titre: "Vous lisez ensemble",
              texte:
                "Page par page, avec lecture à voix haute, puis en PDF à imprimer.",
            },
          ].map((etape) => (
            <div key={etape.num} className="carte carte-interactive text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-magique-primaire/10 text-xl">
                {etape.emoji}
              </div>
              <h3 className="mt-3 font-semibold">
                <span className="text-magique-primaire">{etape.num}.</span>{" "}
                {etape.titre}
              </h3>
              <p className="mt-2 text-sm text-magique-texteClair">{etape.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Garanties */}
      <section className="grid gap-6 sm:grid-cols-3">
        <div className="carte carte-interactive text-center">
          <div className="text-3xl">🦊</div>
          <h2 className="mt-2 font-semibold">Personnages originaux</h2>
          <p className="mt-2 text-sm text-magique-texteClair">
            Uniquement des héros créés pour l'application. Aucun personnage sous
            droits n'est utilisé.
          </p>
        </div>
        <div className="carte carte-interactive text-center">
          <div className="text-3xl">📷🚫</div>
          <h2 className="mt-2 font-semibold">Aucune photo demandée</h2>
          <p className="mt-2 text-sm text-magique-texteClair">
            Nous ne demandons jamais de photo de votre enfant. Seuls le prénom et
            l'âge sont utilisés.
          </p>
        </div>
        <div className="carte carte-interactive text-center">
          <div className="text-3xl">✅</div>
          <h2 className="mt-2 font-semibold">Consentement parental</h2>
          <p className="mt-2 text-sm text-magique-texteClair">
            Chaque création nécessite le consentement explicite d'un parent ou
            représentant légal.
          </p>
        </div>
      </section>

      {/* Exemple de livre, présenté comme un livre ouvert */}
      <section className="carte">
        <h2 className="text-2xl font-bold text-gradient">Exemple de livre</h2>
        <p className="mt-1 text-magique-texteClair">
          « L'aventure de Sami à la boulangerie »
        </p>
        <div className="mt-5 grid gap-1 overflow-hidden rounded-2xl border border-magique-primaire/10 sm:grid-cols-2">
          <div className="bg-magique-fond p-6 text-lg leading-relaxed">
            Ce matin, Sami part acheter le pain. En chemin, il rencontre un petit
            chat tout doux, perdu près de la fontaine.
            <p className="mt-3 text-xs italic text-magique-texteClair">
              ✦ Sami marche dans une rue ensoleillée, un chaton à ses pieds.
            </p>
          </div>
          <div className="bg-white p-6 text-lg leading-relaxed">
            Ensemble, ils vivent une drôle d'aventure et rentrent à la maison, le
            cœur tout content.
            <p className="mt-3 text-xs italic text-magique-texteClair">
              ✦ Sami et le chaton rentrent, main dans la patte, au coucher du soleil.
            </p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link href="/connexion" className="btn-primaire">
            ✨ Créer l'histoire de mon enfant
          </Link>
        </div>
      </section>
    </div>
  );
}
