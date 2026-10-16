/**
 * Page affichée après la demande d'un lien magique.
 */

export default function VerifierPage() {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-3xl font-bold text-magique-primaire">Vérifiez vos emails</h1>
      <p className="mt-4 text-magique-texteClair">
        Un lien de connexion vous a été envoyé. Ouvrez-le depuis cet appareil
        pour vous connecter. Le lien expire après un court délai pour votre
        sécurité.
      </p>
    </div>
  );
}
