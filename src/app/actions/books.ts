"use server";

/**
 * Server Actions : création et suppression de livres.
 *
 * La création applique l'ensemble des règles non négociables :
 *  - consentement parental obligatoire ;
 *  - validation de la saisie (Zod) ;
 *  - refus des personnages protégés et filtre de contenu sur l'entrée ;
 *  - limite quotidienne par utilisateur ;
 *  - génération serveur + filtre de contenu sur la sortie.
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser, hasParentalConsent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createBookSchema, checkUserText } from "@/lib/validation";
import { checkDailyBookLimit } from "@/lib/rateLimit";
import { generateStory } from "@/lib/storyGenerator";
import { findHeroById } from "@/lib/heroes";
import type { LongueurKey } from "@/lib/validation";

export interface CreateBookResult {
  ok: boolean;
  message: string;
  /** Identifiant du livre créé (même en cas d'échec de génération). */
  bookId?: string;
}

export async function createBook(formData: FormData): Promise<CreateBookResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  // Règle non négociable : pas de création sans consentement parental.
  if (!hasParentalConsent(user)) {
    return {
      ok: false,
      message:
        "Vous devez d'abord enregistrer votre consentement parental avant de créer un livre.",
    };
  }

  const parsed = createBookSchema.safeParse({
    childId: String(formData.get("childId") ?? ""),
    mode: String(formData.get("mode") ?? ""),
    heroId: formData.get("heroId") ? String(formData.get("heroId")) : undefined,
    prompt: formData.get("prompt") ? String(formData.get("prompt")) : undefined,
    longueur: String(formData.get("longueur") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  }
  const input = parsed.data;

  // Vérifie l'aventure libre (personnages protégés + filtre de contenu).
  if (input.mode === "libre" && input.prompt) {
    const check = checkUserText(input.prompt);
    if (!check.ok) return { ok: false, message: check.message };
  }

  // Vérifie que l'enfant appartient bien à l'utilisateur.
  const child = await prisma.child.findFirst({
    where: { id: input.childId, userId: user.id },
  });
  if (!child) return { ok: false, message: "Enfant introuvable." };

  // Limite quotidienne pour contrôler les coûts.
  const limit = await checkDailyBookLimit(user.id);
  if (!limit.allowed) return { ok: false, message: limit.message };

  // Détermine un thème lisible pour l'affichage.
  const theme =
    input.mode === "hero"
      ? findHeroById(input.heroId ?? "")?.nom ?? "Aventure avec un héros"
      : "Aventure personnalisée";

  // Crée le livre en statut « generating ».
  const book = await prisma.book.create({
    data: {
      userId: user.id,
      childId: child.id,
      title: "Histoire en cours…",
      theme,
      status: "generating",
    },
  });

  // Lance la génération. En cas d'échec, marque le livre « failed ».
  const result = await generateStory({
    childFirstName: child.firstName,
    childAge: child.age,
    mode: input.mode,
    heroId: input.heroId,
    prompt: input.prompt,
    longueur: input.longueur as LongueurKey,
  });

  if (!result.ok) {
    await prisma.book.update({
      where: { id: book.id },
      data: { status: "failed", errorMessage: result.message },
    });
    revalidatePath("/bibliotheque");
    return { ok: false, message: result.message, bookId: book.id };
  }

  await prisma.book.update({
    where: { id: book.id },
    data: {
      status: "ready",
      title: result.story.titre,
      pages: result.story,
      errorMessage: null,
    },
  });

  revalidatePath("/bibliotheque");
  return { ok: true, message: "Votre livre est prêt !", bookId: book.id };
}

export async function deleteBook(bookId: string): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id, deletedAt: null },
  });
  if (!book) return { ok: false, message: "Livre introuvable." };

  // Suppression logique.
  await prisma.book.update({
    where: { id: bookId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/bibliotheque");
  return { ok: true, message: "Livre supprimé." };
}
