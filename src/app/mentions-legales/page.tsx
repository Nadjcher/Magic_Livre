/**
 * Mentions légales.
 *
 * L'identité de l'éditeur est lue dans les variables d'environnement (lib/legal).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { identiteLegale } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergeur et contact du site Encore une histoire, livres personnalisés pour enfants.",
  alternates: { canonical: "/mentions-legales" },
};


export default function MentionsLegalesPage() {
  const id = identiteLegale();
  return (
    <article className="mx-auto max-w-2xl space-y-4 leading-relaxed">
      <h1 className="text-3xl sm:text-4xl">Mentions légales</h1>
      <h2 className="text-xl font-semibold">Éditeur du site</h2>
      <p>
        {id.nom}, {id.statut}. SIREN : {id.siren}. Adresse : {id.adresse}. Email : {id.email}.
        Directeur de la publication : {id.nom}. {id.tva}
      </p>
      <h2 className="text-xl font-semibold">Hébergement</h2>
      <p>
        Site hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vercel.com).
        Base de données hébergée par Neon Inc. (neon.tech), serveurs situés dans l'Union européenne.
      </p>
      <h2 className="text-xl font-semibold">Propriété intellectuelle</h2>
      <p>
        La marque « Encore une histoire », la maquette et les textes du site appartiennent à l'éditeur. Les histoires et
        illustrations sont des créations originales générées à la demande ; aucun personnage protégé par des droits
        de tiers n'est utilisé.
      </p>
      <h2 className="text-xl font-semibold">Ventes</h2>
      <p>
        Les ventes sont régies par nos <Link href="/cgv" className="underline">conditions générales de vente</Link>.
      </p>
    </article>
  );
}
