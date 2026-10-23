/**
 * Page de réinitialisation : lit le jeton et l'email de l'URL, puis affiche le
 * formulaire de nouveau mot de passe.
 */

import EnTetePage from "@/components/EnTetePage";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const dynamic = "force-dynamic";

export default function ReinitialiserPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string };
}) {
  const email = (searchParams.email ?? "").toLowerCase().trim();
  const token = searchParams.token ?? "";

  return (
    <div className="mx-auto max-w-md">
      <EnTetePage surtitre="Presque fini" titre="Nouveau mot de passe">
        Choisissez un nouveau mot de passe pour votre compte.
      </EnTetePage>
      <ResetPasswordForm email={email} token={token} />
    </div>
  );
}
