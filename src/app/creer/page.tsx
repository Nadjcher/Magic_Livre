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
      <EnTetePage surtitre="Le studio de création" titre="Créer un livre">
        En quelques étapes, composez une histoire unique à l'image de votre
        enfant.
      </EnTetePage>
      <CreateBookForm enfants={children} heroes={HEROES} />
    </div>
  );
}
