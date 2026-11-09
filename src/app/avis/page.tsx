/** Tous les avis clients vérifiés. */

import type { Metadata } from "next";
import Link from "next/link";
import { avisPublics } from "@/lib/reviews";
import AvisListe, { Etoiles } from "@/components/AvisListe";

export async function generateMetadata(): Promise<Metadata> {
  const { total } = await avisPublics(1);
  return {
    title: "Avis des parents",
    description: "Les avis vérifiés des parents qui ont offert un livre personnalisé Encore une histoire à leur enfant.",
    alternates: { canonical: "/avis" },
    // Page vide (pas encore d'avis) : pas d'indexation, pour ne pas montrer une page creuse à Google.
    robots: total > 0 ? { index: true, follow: true } : { index: false, follow: true },
  };
}
export const revalidate = 300;

export default async function AvisPage() {
  const { avis, moyenne, total } = await avisPublics(100);
  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl sm:text-5xl">Ce qu'en disent les parents</h1>
        {total > 0 ? (
          <p className="text-lg">
            <Etoiles note={moyenne} taille="text-2xl" /> <strong>{moyenne.toLocaleString("fr-FR")}/5</strong>{" "}
            <span className="text-magique-texteClair">· {total} avis vérifié{total > 1 ? "s" : ""}</span>
          </p>
        ) : (
          <p className="text-magique-texteClair">Les premiers avis arrivent bientôt.</p>
        )}
        <p className="text-sm text-magique-texteClair">Seuls les parents ayant acheté un livre peuvent laisser un avis.</p>
      </header>
      <AvisListe avis={avis} />
      <p className="text-center">
        <Link href="/creer" className="btn-primaire">Créer son histoire</Link>
      </p>
    </div>
  );
}
