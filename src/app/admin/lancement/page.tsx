/** Tableau de bord du lancement (administrateur). */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { compterAttente, ventesOuvertes } from "@/lib/lancement";
import EnvoiCampagnes from "@/components/EnvoiCampagnes";
import { CAMPAGNES, compterCampagne } from "@/lib/campagnes";

export const metadata: Metadata = { title: "Lancement", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function AdminLancementPage() {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) notFound();
  const { liste, comptes } = await compterAttente();
  const ouvert = ventesOuvertes();
  const campagnes = await Promise.all(CAMPAGNES.map(async (c) => ({ ...c, nombre: await compterCampagne(c.id) })));
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
      </div>
      <div className="carte space-y-3">
        <h2 className="text-xl">Emails de lancement</h2>
        <p className="text-sm text-magique-texteClair">
          Chaque email s'adapte à la personne (par exemple avec le prénom et le titre du livre déjà créé), n'est reçu qu'une
          fois, n'est pas envoyé aux clients quand il ne les concerne pas, et contient un lien de désinscription.
          L'email de bienvenue part tout seul à chaque inscription sur la liste d'attente.
        </p>
        <EnvoiCampagnes campagnes={campagnes} />
      </div>
    </div>
  );
}
