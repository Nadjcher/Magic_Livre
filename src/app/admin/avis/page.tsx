/** Modération des avis (comptes administrateurs : variable ADMIN_EMAILS). */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { tousLesAvis } from "@/lib/reviews";
import { Etoiles } from "@/components/AvisListe";
import ModerationAvis from "@/components/ModerationAvis";

export const metadata: Metadata = { title: "Modération des avis", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminAvisPage() {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) notFound();
  const avis = await tousLesAvis();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl">Modération des avis</h1>
      {avis.length === 0 && <p className="text-magique-texteClair">Aucun avis pour l'instant.</p>}
      <ul className="space-y-3">
        {avis.map((a) => (
          <li key={a.id} className={`carte ${a.visible ? "" : "opacity-60"}`}>
            <div className="flex items-center justify-between gap-3">
              <Etoiles note={a.note} />
              <ModerationAvis id={a.id} visible={a.visible} />
            </div>
            <p className="mt-2">« {a.texte} »</p>
            <p className="mt-1 text-sm text-magique-texteClair">
              {a.auteur} · {new Date(a.createdAt).toLocaleDateString("fr-FR")} · {a.visible ? "publié" : "masqué"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
