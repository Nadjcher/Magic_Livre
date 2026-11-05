"use server";

/**
 * Club : recevoir un livre de la sélection du mois, en un clic.
 * Le héros est repris du dernier livre de l'enfant (sa fiche dessinée et sa
 * description), donc pas de photo ni de formulaire à remplir.
 */

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getAbonnement } from "@/lib/subscription";
import { selectionDuMois } from "@/lib/selectionMois";
import { storySchema } from "@/lib/storySchema";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { createBook } from "./books";

export interface RecevoirResult {
  ok: boolean;
  message: string;
  bookId?: string;
  /** Pas encore de livre pour cet enfant : il faut passer par le formulaire (photo). */
  formulaire?: string;
}

/** Description courte (≤ 120 caractères) du héros, coupée proprement. */
function resume(texte: string | undefined): string {
  if (!texte) return "";
  const t = texte.replace(/\s+/g, " ").trim();
  if (t.length <= 120) return t;
  const coupe = t.slice(0, 120);
  return coupe.slice(0, Math.max(coupe.lastIndexOf(","), coupe.lastIndexOf(" "))).trim();
}

export async function recevoirLivreDuMois(childId: string, themeId: string): Promise<RecevoirResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Connectez-vous pour recevoir ce livre." };
  const ab = await getAbonnement(user.id);
  if (!ab.actif) return { ok: false, message: "La sélection du mois est réservée aux membres du Club." };

  const child = await prisma.child.findFirst({ where: { id: childId, userId: user.id }, select: { id: true, age: true } });
  if (!child) return { ok: false, message: "Enfant introuvable." };

  const propose = selectionDuMois(child.age, ab.quota).find((p) => p.theme.id === themeId);
  if (!propose) return { ok: false, message: "Ce livre ne fait pas partie de la sélection du mois." };

  // Déjà reçu ce mois-ci (double clic, deuxième onglet) : on renvoie le même livre.
  const deja = await prisma.book.findFirst({
    where: {
      userId: user.id,
      childId: child.id,
      theme: propose.theme.titre,
      deletedAt: null,
      status: { not: "failed" },
      createdAt: { gte: ab.periodStart ?? new Date(Date.now() - 30 * 86400_000) },
    },
    select: { id: true },
  });
  if (deja) return { ok: true, message: "Ce livre est déjà dans votre bibliothèque.", bookId: deja.id };
  if (ab.restants <= 0) return { ok: false, message: "Vous avez reçu tous vos livres du mois. Les prochains arrivent au renouvellement." };

  // Le héros : repris du dernier livre réussi de l'enfant.
  const dernier = await prisma.book.findFirst({
    where: { userId: user.id, childId: child.id, status: "ready", deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { pages: true },
  });
  const story = dernier ? storySchema.safeParse(dernier.pages) : null;
  if (!story?.success) {
    return {
      ok: false,
      message: "Pour que le héros lui ressemble, créez d'abord un premier livre avec sa photo.",
      formulaire: `/creer?theme=${propose.theme.id}`,
    };
  }
  const fiche = story.data.fiches?.heros ?? story.data.couvertureUrl ?? null;
  const photo = fiche ? await fetchAsDataUrl(fiche, { maxPx: 1024, quality: 86 }).catch(() => null) : null;

  const fd = new FormData();
  fd.set("childId", child.id);
  fd.set("mode", "theme");
  fd.set("themeId", propose.theme.id);
  fd.set("longueur", "moyenne");
  fd.set("format", propose.format);
  fd.set("style", propose.style);
  const apparence = resume(story.data.personnages);
  if (apparence) fd.set("appearance", apparence);
  if (photo) fd.set("photo", photo);

  const r = await createBook(fd);
  return { ok: r.ok, message: r.message, bookId: r.ok ? r.bookId : undefined };
}
