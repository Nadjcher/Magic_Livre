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

export default async function CreerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  // Consentement parental obligatoire avant la première création.
  if (!hasParentalConsent(user)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-magique-primaire">
          Consentement parental
        </h1>
        <p className="text-magique-texteClair">
          Avant de créer un livre, nous avons besoin de votre consentement
          explicite.
        </p>
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
      <h1 className="text-3xl font-bold text-magique-primaire">Créer un livre</h1>
      <CreateBookForm enfants={children} heroes={HEROES} />
    </div>
  );
}
