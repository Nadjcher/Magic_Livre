/** Page de désinscription des emails (lien signé, sans connexion). */

import type { Metadata } from "next";
import Link from "next/link";
import { desinscrire, jetonValide } from "@/lib/campagnes";

export const metadata: Metadata = { title: "Désinscription", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DesinscriptionPage(props: { searchParams: Promise<{ e?: string; t?: string; ok?: string }> }) {
  const searchParams = await props.searchParams;
  const email = (searchParams.e ?? "").toLowerCase();
  const jeton = searchParams.t ?? "";
  const valide = Boolean(email) && jetonValide(email, jeton);

  async function confirmer() {
    "use server";
    if (valide) await desinscrire(email);
    const { redirect } = await import("next/navigation");
    redirect(`/desinscription?e=${encodeURIComponent(email)}&t=${jeton}&ok=1`);
  }

  return (
    <div className="mx-auto max-w-md space-y-5 py-10 text-center">
      <h1 className="text-3xl">Désinscription</h1>
      {!valide ? (
        <p className="text-magique-texteClair">Ce lien n'est pas valide. Utilisez le lien présent en bas de nos emails.</p>
      ) : searchParams.ok ? (
        <>
          <p>C'est fait : vous ne recevrez plus nos emails d'information à l'adresse <strong>{email}</strong>.</p>
          <p className="text-sm text-magique-texteClair">Les emails liés à vos commandes (confirmation, livraison) restent envoyés.</p>
          <Link href="/" className="btn-secondaire">Retour à l'accueil</Link>
        </>
      ) : (
        <>
          <p>Ne plus recevoir nos emails d'information à l'adresse <strong>{email}</strong> ?</p>
          <form action={confirmer}>
            <button type="submit" className="btn-primaire">Me désinscrire</button>
          </form>
        </>
      )}
    </div>
  );
}
