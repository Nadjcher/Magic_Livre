/** Page publique du Club : les formules d'abonnement et les grands classiques. */

import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { getAbonnement } from "@/lib/subscription";
import { THEMES } from "@/lib/themes";
import ClubPlans from "@/components/ClubPlans";
import BandeauLancement from "@/components/BandeauLancement";
import { ventesOuvertes } from "@/lib/lancement";
import { estAdmin } from "@/lib/rateLimit";
import Notice from "@/components/Notice";
import EspaceClub from "@/components/EspaceClub";
import Picto from "@/components/Picto";

export const metadata: Metadata = {
  title: "Le Club : un nouveau livre personnalisé chaque semaine",
  description:
    "Abonnement sans engagement : chaque semaine, un nouveau livre dont votre enfant est le héros, et les grands classiques revisités (Petit Chaperon rouge, Jack et le haricot magique, Pinocchio…).",
  alternates: { canonical: "/club" },
};

export default async function ClubPage(
  props: { searchParams: Promise<{ annule?: string; bienvenue?: string; enfant?: string }> }
) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  const ab = user ? await getAbonnement(user.id) : null;

  // Membre : son espace « Mon Club » (livres du mois, classiques à créer).
  if (user && ab?.actif) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {searchParams.bienvenue && (
          <Notice kind="succes">Bienvenue dans {ab.label} ! Votre sélection de {ab.quota} livres du mois vous attend.</Notice>
        )}
        <EspaceClub userId={user.id} ab={ab} enfantId={searchParams.enfant} />
      </div>
    );
  }
  const classiques = THEMES.filter((t) => t.categorie === "classiques");

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-5xl">Le Club des histoires</h1>
        <p className="mx-auto max-w-[52ch] text-lg text-magique-texteClair">
          Chaque semaine, un nouveau livre dont votre enfant est le héros. Et les plus beaux contes du
          monde, réécrits pour lui. Sans engagement : vous arrêtez quand vous voulez.
        </p>
      </header>

      {!ventesOuvertes() && !(user && estAdmin(user.email)) && <BandeauLancement source="club" />}

      {searchParams.annule && <Notice kind="info">Abonnement non souscrit. Vous pouvez réessayer quand vous voulez.</Notice>}

      <ClubPlans connecte={Boolean(user)} membre={ab?.actif ? ab.label : null} />

      <section className="space-y-5">
        <h2 className="text-center text-3xl">Les grands classiques, avec votre enfant en héros</h2>
        <p className="mx-auto max-w-[56ch] text-center text-magique-texteClair">
          Les contes que vous connaissez par cœur, réécrits en douceur pour son âge, avec son prénom
          et son visage. Réservés aux membres du Club.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {classiques.map((t) => (
            <li key={t.id}>
              <Link href={`/catalogue/${t.id}`} className="group flex h-full flex-col items-center rounded-2xl bg-white/[0.05] p-4 text-center transition hover:bg-white/[0.09]">
                <Picto cle={`themes/${t.id}`} secours={t.emoji} taille={72} className="transition duration-300 group-hover:-translate-y-1" />
                <p className="mt-2 font-semibold">{t.titre}</p>
                <p className="text-sm text-magique-texteClair">{t.accroche}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="carte space-y-3">
        <h2 className="text-2xl">Questions fréquentes</h2>
        <p><strong>Je peux arrêter quand je veux ?</strong> Oui, en un clic dans « Mon compte ». Votre abonnement reste actif jusqu'à la fin du mois déjà payé.</p>
        <p><strong>Les livres restent-ils à moi ?</strong> Oui : chaque livre créé avec le Club reste dans votre bibliothèque, avec son PDF, même après l'arrêt de l'abonnement.</p>
        <p><strong>Et si je n'utilise pas tous mes livres ?</strong> Le compteur repart à zéro chaque mois, à la date de renouvellement.</p>
      </section>
    </div>
  );
}
