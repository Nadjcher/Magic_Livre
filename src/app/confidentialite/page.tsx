/**
 * Politique de confidentialité (RGPD).
 *
 * ⚠️ Modèle à faire relire par un juriste avant l'ouverture des paiements.
 */

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
        historique des livres et des commandes. Aucune photo n'est demandée ni
        stockée.
      </p>

      <h2 className="text-xl font-semibold">Finalités</h2>
      <p className="text-magique-texteClair">
        Les données servent à créer et afficher les livres, à gérer les paiements
        et à assurer le fonctionnement du service. Le prénom de l'enfant est
        transmis au modèle de génération de texte uniquement pour écrire
        l'histoire.
      </p>

      <h2 className="text-xl font-semibold">Consentement parental</h2>
      <p className="text-magique-texteClair">
        La date et la version des CGU acceptées sont conservées comme preuve du
        consentement parental.
      </p>

      <h2 className="text-xl font-semibold">Conservation et suppression</h2>
      <p className="text-magique-texteClair">
        Vous pouvez supprimer votre compte à tout moment depuis la page « Mon
        compte ». La suppression efface vos enfants, livres et commandes. Seul un
        journal légal minimal lié aux obligations comptables peut être conservé.
      </p>

      <h2 className="text-xl font-semibold">Vos droits</h2>
      <p className="text-magique-texteClair">
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
        d'effacement et de portabilité. Pour toute demande : [email de contact].
      </p>

      <h2 className="text-xl font-semibold">Sous-traitants</h2>
      <p className="text-magique-texteClair">
        Génération de texte : Anthropic. Paiement : Stripe. Hébergement :
        [Vercel / autre]. Base de données : [Supabase / Neon]. Chacun traite les
        données pour notre compte, dans le cadre de ses propres engagements.
      </p>

      <p className="text-sm italic text-magique-texteClair">
        Document à faire valider par un juriste avant le lancement payant.
      </p>
    </article>
  );
}
