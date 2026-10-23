/**
 * Page de création de livre. Impose le consentement parental avant toute
 * création.
 */

import { redirect } from "next/navigation";
import { getCurrentUser, hasParentalConsent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { HEROES } from "@/lib/heroes";
import CreateBookForm from "@/components/CreateBookForm";
import ConsentForm from "@/components/ConsentForm";
import EnTetePage from "@/components/EnTetePage";
import { SceneIllustration } from "@/components/Illustrations";

function euros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

// La génération (histoire + illustrations) peut durer plusieurs dizaines de
// secondes : on laisse jusqu'à 60 s à la fonction serverless.
export const maxDuration = 60;

export default async function CreerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  // Consentement parental obligatoire avant la première création.
  if (!hasParentalConsent(user)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <EnTetePage surtitre="Une dernière étape" titre="Consentement parental">
          Avant de créer un livre, nous avons besoin de votre consentement
          explicite.
        </EnTetePage>
        <ConsentForm termsVersion={env.termsVersion()} />
      </div>
    );
  }

  const children = await prisma.child.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, age: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-6">
        <EnTetePage surtitre="Le studio de création" titre="Créer un livre">
          En quelques étapes, composez une histoire unique à l'image de votre
          enfant.
        </EnTetePage>
        <SceneIllustration
          name="write"
          alt=""
          className="hidden h-28 w-28 flex-none sm:block"
        />
      </div>
      <CreateBookForm
        enfants={children}
        heroes={HEROES}
        prixStandard={euros(env.bookPriceCents())}
        prixPremium={euros(env.bookPricePremiumCents())}
      />
    </div>
  );
}
