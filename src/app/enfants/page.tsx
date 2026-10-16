/**
 * Page de gestion des enfants.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ChildrenManager from "@/components/ChildrenManager";

export default async function EnfantsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const children = await prisma.child.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, age: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-magique-primaire">Mes enfants</h1>
      <p className="text-magique-texteClair">
        Nous ne collectons que le prénom et l'âge, nécessaires pour personnaliser
        l'histoire. Aucune photo n'est demandée.
      </p>
      <ChildrenManager initial={children} />
    </div>
  );
}
