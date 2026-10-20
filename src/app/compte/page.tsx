/**
 * Page « Mon compte » : informations, état du consentement, suppression du
 * compte (RGPD).
 */

import { redirect } from "next/navigation";
import { getCurrentUser, hasParentalConsent } from "@/lib/session";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import EnTetePage from "@/components/EnTetePage";

export default async function ComptePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const consent = hasParentalConsent(user);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EnTetePage surtitre="Vos informations" titre="Mon compte" />

      <div data-tilt className="carte-relief space-y-2 p-6">
        <p>
          <span className="font-semibold">Email :</span> {user.email}
        </p>
        <p>
          <span className="font-semibold">Consentement parental :</span>{" "}
          {consent ? (
            <span className="text-emerald-700">
              Enregistré le {user.parentalConsentAt?.toLocaleDateString("fr-FR")} (CGU{" "}
              {user.termsVersion})
            </span>
          ) : (
            <span className="text-magique-texteClair">Non enregistré</span>
          )}
        </p>
      </div>

      <div className="carte-relief space-y-3 p-6">
        <h2 className="text-xl">Supprimer mon compte</h2>
        <p className="text-sm text-magique-texteClair">
          Conformément au RGPD, vous pouvez supprimer votre compte et toutes les
          données associées (enfants, livres, commandes). Cette action est
          irréversible.
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  );
}
