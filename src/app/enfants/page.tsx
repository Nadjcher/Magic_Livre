/**
 * Page de gestion des enfants.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ChildrenManager from "@/components/ChildrenManager";
import EnTetePage from "@/components/EnTetePage";

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
      <EnTetePage surtitre="Les futurs héros" titre="Mes enfants">
        Nous ne collectons que le prénom et l'âge, nécessaires pour personnaliser
        l'histoire. Aucune photo n'est demandée.
      </EnTetePage>
      <ChildrenManager initial={children} />
    </div>
  );
}
