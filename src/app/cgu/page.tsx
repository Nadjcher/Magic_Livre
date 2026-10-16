/**
 * Conditions générales d'utilisation (CGU).
 *
 * ⚠️ Modèle à faire relire par un juriste avant l'ouverture des paiements.
 */

import { env } from "@/lib/env";

export default function CguPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-magique-primaire">
        Conditions générales d'utilisation
      </h1>
      <p className="text-sm text-magique-texteClair">Version : {env.termsVersion()}</p>

      <h2 className="text-xl font-semibold">1. Objet</h2>
      <p className="text-magique-texteClair">
        « Mon Livre Magique » permet à un parent ou représentant légal de créer
        des livres personnalisés pour enfants, à lire en ligne et à télécharger
        au format PDF après paiement.
      </p>

      <h2 className="text-xl font-semibold">2. Consentement parental</h2>
      <p className="text-magique-texteClair">
        L'utilisateur déclare être le parent ou le représentant légal de l'enfant
        concerné. Aucune création n'est possible sans consentement parental
        explicite, enregistré avec la date et la version des présentes CGU.
      </p>

      <h2 className="text-xl font-semibold">3. Contenu et personnages</h2>
      <p className="text-magique-texteClair">
        Seuls des héros originaux ou des descriptions libres sont autorisés.
        Toute saisie mentionnant un personnage ou une marque protégés est
        refusée. Un filtre de contenu vérifie les saisies et les histoires
        générées afin d'écarter tout contenu inadapté aux enfants.
      </p>

      <h2 className="text-xl font-semibold">4. Paiement</h2>
      <p className="text-magique-texteClair">
        Le téléchargement du PDF est proposé à l'unité, via un paiement sécurisé.
        Le prix est affiché avant l'achat. Le téléchargement n'est débloqué
        qu'après validation du paiement.
      </p>

      <h2 className="text-xl font-semibold">5. Données personnelles</h2>
      <p className="text-magique-texteClair">
        Le traitement des données est décrit dans la politique de confidentialité.
        L'utilisateur peut supprimer son compte et ses données à tout moment.
      </p>

      <h2 className="text-xl font-semibold">6. Responsabilité</h2>
      <p className="text-magique-texteClair">
        Les histoires sont générées automatiquement. Malgré les filtres mis en
        place, l'éditeur invite les parents à relire le contenu avant de le
        partager avec l'enfant.
      </p>

      <p className="text-sm italic text-magique-texteClair">
        Document à faire valider par un juriste avant le lancement payant.
      </p>
    </article>
  );
}
