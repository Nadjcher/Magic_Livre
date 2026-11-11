/**
 * Politique de confidentialité (RGPD).
 *
 * ⚠️ Modèle à faire relire par un juriste avant l'ouverture des paiements.
 */

import { DUREES_CONSERVATION } from "@/lib/conservation";
import { identiteLegale } from "@/lib/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Encore une histoire protège les données de votre famille : photo jamais conservée, données minimales, suppression à tout moment.",
  alternates: { canonical: "/confidentialite" },
};


export default function ConfidentialitePage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl sm:text-4xl">
        Politique de confidentialité
      </h1>

      <h2 className="text-xl font-semibold">Données collectées</h2>
      <p className="text-magique-texteClair">
        Nous collectons uniquement les données nécessaires : adresse email du
        parent (connexion), prénom et âge de l'enfant (personnalisation),
        historique des livres et des commandes. Si vous le souhaitez, la fiche de
        l'enfant pour les histoires (son doudou, ce qu'il aime, ce qui lui fait peur,
        les proches à citer), facultative et modifiable ou effaçable à tout moment.
        La photo éventuelle sert seulement à dessiner le héros et n'est jamais conservée.
      </p>

      <h2 className="text-xl font-semibold">Finalités</h2>
      <p className="text-magique-texteClair">
        Les données servent à créer et afficher les livres, à gérer les paiements
        et à assurer le fonctionnement du service. Le prénom de l'enfant est
        transmis au modèle de génération de texte uniquement pour écrire
        l'histoire. Pour la qualité des histoires, une histoire jugée insuffisante
        par notre relecture automatique peut être relue par notre équipe, le prénom
        de l'enfant masqué et sans lien avec votre compte.
      </p>

      <h2 className="text-xl font-semibold">Consentement parental</h2>
      <p className="text-magique-texteClair">
        La date et la version des CGU acceptées sont conservées comme preuve du
        consentement parental.
      </p>

      <h2 className="text-xl font-semibold">Conservation et suppression</h2>
      <p className="text-magique-texteClair">
        Nous gardons vos données le moins longtemps possible. Une suppression automatique a lieu chaque nuit.
        Vous pouvez aussi supprimer votre compte à tout moment depuis « Mon compte » : vos enfants, livres et
        illustrations sont alors effacés immédiatement.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/15">
              <th className="py-2 pr-4 font-semibold">Donnée</th>
              <th className="py-2 font-semibold">Durée de conservation</th>
            </tr>
          </thead>
          <tbody>
            {DUREES_CONSERVATION.map((d) => (
              <tr key={d.donnee} className="border-b border-white/10 align-top">
                <td className="py-2 pr-4 font-semibold">{d.donnee}</td>
                <td className="py-2 text-magique-texteClair">{d.duree}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold">Vos droits</h2>
      <p className="text-magique-texteClair">
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
        d'effacement et de portabilité. Pour toute demande : {identiteLegale().email}.
      </p>

      <h2 className="text-xl font-semibold">Sous-traitants</h2>
      <p className="text-magique-texteClair">
        Écriture des histoires : Anthropic (modèles Claude), via fal.ai et OpenRouter.
        Illustrations, animations et voix : fal.ai (modèles d'images, de vidéo et ElevenLabs), Google
        (Gemini). Paiement : Stripe. Impression et livraison du livre relié : Gelato. Hébergement : Vercel.
        Base de données : Neon. Envoi des emails : notre prestataire SMTP. Chacun traite les données
        uniquement pour fournir le service. La photo éventuellement fournie est transmise aux outils
        d'illustration le temps de la création, puis n'est jamais conservée par
        nos soins ; ses métadonnées (position GPS, date) sont supprimées avant tout envoi.
      </p>
      <h2 className="text-xl font-semibold">Transferts hors de l'Union européenne</h2>
      <p className="text-magique-texteClair">
        Le site et la base de données sont hébergés dans l'Union européenne (Francfort). Certains
        prestataires (outils d'intelligence artificielle, paiement, envoi d'emails) sont établis aux
        États-Unis : les transferts sont encadrés par les clauses contractuelles types de la Commission
        européenne et/ou le cadre de protection des données UE–États-Unis. Ces prestataires ne sont
        autorisés à utiliser les données que pour fournir le service.
      </p>

      <p className="text-sm italic text-magique-texteClair">
        Document à faire valider par un juriste avant le lancement payant.
      </p>
    </article>
  );
}
