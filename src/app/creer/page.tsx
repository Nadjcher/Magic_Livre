/**
 * Page de création de livre. Impose le consentement parental avant toute
 * création.
 */

import type { Metadata } from "next";

import { redirect } from "next/navigation";
import { getCurrentUser, hasParentalConsent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import CreateBookForm from "@/components/CreateBookForm";
import { getAbonnement } from "@/lib/subscription";
import EnTetePage from "@/components/EnTetePage";

export const metadata: Metadata = {
  title: "Créer un livre",
  description: "Espace personnel Encore une histoire.",
  robots: { index: false, follow: false },
};


function euros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

// La génération (histoire + illustrations) peut durer plusieurs dizaines de
// secondes (jusqu'à ~1 min 30 avec le portrait fal) : on laisse 5 min, le
// maximum du plan Vercel gratuit avec Fluid compute.
export const maxDuration = 300;

export default async function CreerPage(
  props: {
    searchParams: Promise<{ theme?: string; prenom?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  // Prénom tapé sur la page produit : lettres, espaces, tirets, apostrophes.
  const prenom = (searchParams.prenom ?? "").replace(/[^\p{L}\s'’-]/gu, "").trim().slice(0, 30) || undefined;
  const user = await getCurrentUser();
  if (!user) {
    const q = new URLSearchParams();
    if (searchParams.theme) q.set("theme", searchParams.theme);
    if (prenom) q.set("prenom", prenom);
    const suite = q.size ? `/creer?${q}` : "/creer";
    redirect(`/connexion?suite=${encodeURIComponent(suite)}`);
  }

  const ab = await getAbonnement(user.id);
  const children = await prisma.child.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, age: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-6">
        <EnTetePage surtitre="Le studio de création" titre="Créer un livre">
          Trois petites étapes : le héros, l'histoire, les finitions. Tout est déjà réglé pour son âge.
        </EnTetePage>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/feerique/write.webp"
          alt=""
          className="hidden h-28 w-28 flex-none object-contain sm:block"
        />
      </div>
      <CreateBookForm
        enfants={children}
        initialThemeId={searchParams.theme}
        initialPrenom={prenom}
        prixStandard={euros(env.bookPriceCents())}
        prixPremium={euros(env.bookPricePremiumCents())}
        abonnement={{ actif: ab.actif, label: ab.label, restants: ab.restants, quota: ab.quota, premium: ab.premium }}
        consentRequis={!hasParentalConsent(user)}
        termsVersion={env.termsVersion()}
      />
    </div>
  );
}
