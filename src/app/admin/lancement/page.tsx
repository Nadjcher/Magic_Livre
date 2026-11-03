/** Tableau de bord du lancement (administrateur). */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { compterAttente, ventesOuvertes } from "@/lib/lancement";
import EnvoiOuverture from "@/components/EnvoiOuverture";

export const metadata: Metadata = { title: "Lancement", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLancementPage() {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) notFound();
  const { liste, comptes } = await compterAttente();
  const ouvert = ventesOuvertes();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl">Lancement</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="carte"><p className="text-sm text-magique-texteClair">Ventes</p><p className="font-serif text-2xl">{ouvert ? "Ouvertes" : "Fermées"}</p></div>
        <div className="carte"><p className="text-sm text-magique-texteClair">Liste d'attente</p><p className="font-serif text-2xl">{liste}</p></div>
        <div className="carte"><p className="text-sm text-magique-texteClair">Comptes créés</p><p className="font-serif text-2xl">{comptes}</p></div>
      </div>
      <div className="carte space-y-3 text-sm">
        <p>
          Les ventes s'ouvrent automatiquement dès que la clé Stripe réelle (<code>sk_live_…</code>) est en place.
          Vous pouvez forcer avec la variable <code>VENTES_OUVERTES</code> (true / false). En tant qu'administrateur,
          vous pouvez acheter même quand les ventes sont fermées, pour tester.
        </p>
        <p>Le jour J, une fois les ventes ouvertes, envoyez l'email d'ouverture (par lots de 150 ; chaque personne ne le reçoit qu'une fois) :</p>
        <EnvoiOuverture />
      </div>
    </div>
  );
}
