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
import { waitUntil } from "@vercel/functions";
import { getCurrentUser, hasParentalConsent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createBookSchema, checkUserText } from "@/lib/validation";
import { checkDailyBookLimit } from "@/lib/rateLimit";
import { generateStory } from "@/lib/storyGenerator";
import { describeChildFromPhoto } from "@/lib/illustration";
import { findThemeById } from "@/lib/themes";
import type { LongueurKey } from "@/lib/validation";
import type { IllustrationStyle } from "@/lib/style_config";

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
    themeId: formData.get("themeId") ? String(formData.get("themeId")) : undefined,
    prompt: formData.get("prompt") ? String(formData.get("prompt")) : undefined,
    longueur: String(formData.get("longueur") ?? ""),
    style: formData.get("style") ? String(formData.get("style")) : undefined,
    appearance: formData.get("appearance")
      ? String(formData.get("appearance"))
      : undefined,
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

  // Détermine l'apparence du héros : description saisie, ou extraite d'une photo
  // optionnelle via vision (la photo n'est NI stockée NI mise dans le livre).
  const appearance = input.appearance ?? "";
  if (appearance.length > 0) {
    const check = checkUserText(appearance);
    if (!check.ok) return { ok: false, message: check.message };
  }
  // Photo de référence : utilisée uniquement pour dessiner un héros ressemblant,
  // envoyée au modèle d'image au moment de la génération, puis JAMAIS stockée.
  let photoRef: { base64: string; mime: string } | undefined;
  const photo = formData.get("photo");
  if (typeof photo === "string") {
    const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(photo);
    if (m) {
      const mime = m[1] === "image/jpg" ? "image/jpeg" : (m[1] as string);
      const data = m[2] ?? "";
      if (data.length > 0 && data.length <= 4_000_000) photoRef = { base64: data, mime };
    }
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
    input.mode === "theme"
      ? findThemeById(input.themeId)?.titre ?? "Histoire personnalisée"
      : "Aventure personnalisée";

  // Édition choisie : premium = illustrations haut de gamme + prix supérieur.
  const premium =
    formData.get("premium") === "on" || formData.get("premium") === "true";

  // Crée le livre en statut « generating ».
  const book = await prisma.book.create({
    data: {
      userId: user.id,
      childId: child.id,
      title: "Histoire en cours…",
      theme,
      status: "generating",
      tier: premium ? "premium" : "standard",
    },
  });

  // La génération (1 à 3 minutes) tourne EN ARRIÈRE-PLAN sur le serveur : on
  // répond tout de suite avec l'identifiant du livre. Fermer l'onglet, changer
  // d'application ou perdre le réseau n'interrompt donc plus la création ; la
  // page du livre se met à jour toute seule quand il est prêt.
  waitUntil(
    genererEtEnregistrer(book.id, {
      childFirstName: child.firstName,
      childAge: child.age,
      mode: input.mode,
      themeId: input.themeId,
      prompt: input.prompt,
      longueur: input.longueur as LongueurKey,
      style: input.style as IllustrationStyle,
      appearance,
      photo: photoRef,
      premium,
    }),
  );

  revalidatePath("/bibliotheque");
  return { ok: true, message: "La création de votre livre a commencé.", bookId: book.id };
}

type GenerationInput = Omit<Parameters<typeof generateStory>[0], "appearance"> & {
  appearance: string;
};

/**
 * Génère le livre puis enregistre le résultat (« ready » ou « failed »).
 * Ne jette jamais : toute erreur inattendue marque le livre « failed » pour que
 * l'utilisateur ne reste pas bloqué devant un livre « en cours » éternel.
 */
async function genererEtEnregistrer(bookId: string, req: GenerationInput): Promise<void> {
  try {
    let appearance = req.appearance;
    // Photo sans description : on décrit le visage (vision) pour renforcer la
    // ressemblance. Best-effort. La photo n'est jamais stockée.
    if (req.photo && appearance.length === 0) {
      appearance = await describeChildFromPhoto(req.photo);
    }

    const result = await generateStory({
      ...req,
      appearance: appearance.length > 0 ? appearance : undefined,
    });

    if (!result.ok) {
      await prisma.book.update({
        where: { id: bookId },
        data: { status: "failed", errorMessage: result.message },
      });
      return;
    }

    await prisma.book.update({
      where: { id: bookId },
      data: {
        status: "ready",
        title: result.story.titre,
        pages: result.story,
        // Livre lisible ; on garde la raison si des illustrations manquent.
        errorMessage: result.imageReport ?? null,
      },
    });
  } catch (e) {
    console.error("[livre] génération interrompue", bookId, String(e).slice(0, 300));
    await prisma.book
      .update({
        where: { id: bookId },
        data: {
          status: "failed",
          errorMessage: "La création a été interrompue. Supprimez ce livre et réessayez.",
        },
      })
      .catch(() => undefined);
  }
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
