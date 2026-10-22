/**
 * Mentions légales.
 *
 * ⚠️ Modèle à compléter et à faire relire par un juriste avant toute ouverture
 * des paiements. Les champs entre crochets doivent être renseignés.
 */

export default function MentionsLegalesPage() {
  return (
    <article className="prose mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl sm:text-4xl">Mentions légales</h1>

      <h2 className="text-xl font-semibold">Éditeur du site</h2>
      <p className="text-magique-texteClair">
        [Nom de la société ou de l'éditeur], [forme juridique], au capital de
        [montant], immatriculée au RCS de [ville] sous le numéro [SIREN].
        Siège social : [adresse]. Adresse email : [email de contact].
        Directeur de la publication : [nom].
      </p>

      <h2 className="text-xl font-semibold">Hébergement</h2>
      <p className="text-magique-texteClair">
        Site hébergé par [nom de l'hébergeur], [adresse de l'hébergeur].
        Base de données hébergée par [Supabase / Neon / autre].
      </p>

      <h2 className="text-xl font-semibold">Propriété intellectuelle</h2>
      <p className="text-magique-texteClair">
        Les héros proposés dans l'application sont des créations originales. Les
        histoires générées sont destinées à un usage familial. Aucun personnage
        protégé par des droits de tiers n'est utilisé.
      </p>

      <p className="text-sm italic text-magique-texteClair">
        Document à faire valider par un juriste avant le lancement payant.
      </p>
    </article>
  );
}
