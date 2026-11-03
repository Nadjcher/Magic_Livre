/** Bandeau de pré-lancement : date d'ouverture + liste d'attente. */

import { DATE_OUVERTURE } from "@/lib/lancement";
import WaitlistForm from "./WaitlistForm";

export default function BandeauLancement({ source }: { source: string }) {
  return (
    <section className="carte space-y-3 border-2 border-magique-primaire/60">
      <p className="font-serif text-xl">✨ Ouverture des commandes le {DATE_OUVERTURE}</p>
      <p className="text-sm text-magique-texteClair">
        Vous pouvez déjà créer et lire le livre de votre enfant gratuitement. Laissez votre email : nous vous
        prévenons à l'ouverture, juste à temps pour les cadeaux de Noël.
      </p>
      <WaitlistForm source={source} />
    </section>
  );
}
