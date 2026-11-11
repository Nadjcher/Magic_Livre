/**
 * Page de gestion des enfants.
 */

import type { Metadata } from "next";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ChildrenManager from "@/components/ChildrenManager";
import EnTetePage from "@/components/EnTetePage";
import FicheEnfantForm from "@/components/FicheEnfantForm";
import { lireFiches } from "@/lib/ficheEnfant";

export const metadata: Metadata = {
  title: "Mes enfants",
  description: "Espace personnel Encore une histoire.",
  robots: { index: false, follow: false },
};


export default async function EnfantsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const children = await prisma.child.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, age: true },
  });
  const fiches = await lireFiches(children.map((c) => c.id));

  return (
    <div className="space-y-6">
      <EnTetePage surtitre="Les futurs héros" titre="Mes enfants">
        Le prénom et l'âge suffisent pour personnaliser l'histoire. La fiche de chaque
        enfant (doudou, goûts, proches) est facultative et effaçable à tout moment.
        Aucune photo n'est conservée.
      </EnTetePage>
      <ChildrenManager initial={children} />
      {children.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl">Leurs fiches pour les histoires</h2>
          {children.map((c) => (
            <FicheEnfantForm key={c.id} childId={c.id} prenom={c.firstName} fiche={fiches.get(c.id)} />
          ))}
        </section>
      )}
    </div>
  );
}
