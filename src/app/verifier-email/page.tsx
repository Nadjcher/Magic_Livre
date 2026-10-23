/**
 * Validation d'adresse email : consomme le jeton reçu par email et marque
 * l'adresse comme vérifiée.
 */

import Link from "next/link";
import { consumeToken } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VerifierEmailPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string };
}) {
  const email = (searchParams.email ?? "").toLowerCase().trim();
  const token = searchParams.token ?? "";
  let ok = false;

  if (email && token && (await consumeToken(`verify:${email}`, token))) {
    try {
      await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
      ok = true;
    } catch {
      ok = false;
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="carte-relief p-8 text-center">
        {ok ? (
          <>
            <h1 className="text-2xl">Adresse confirmée ✦</h1>
            <p className="mt-3 text-magique-texteClair">
              Merci ! Votre adresse email est bien vérifiée.
            </p>
            <Link href="/bibliotheque" className="btn-primaire mt-6 inline-flex">
              Aller à ma bibliothèque
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl">Lien invalide ou expiré</h1>
            <p className="mt-3 text-magique-texteClair">
              Ce lien de confirmation n'est plus valable. Connectez-vous : un
              nouveau lien pourra vous être renvoyé.
            </p>
            <Link href="/connexion" className="btn-primaire mt-6 inline-flex">
              Se connecter
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
