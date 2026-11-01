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
import { createBookSchema, checkUserText, extraSchema } from "@/lib/validation";
import { findFormat, formatsPourAge } from "@/lib/bookFormats";
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

type Photo = { base64: string; mime: string };

/** Lit une photo envoyée en data URL (JPEG/PNG/WebP, taille bornée). */
function lirePhoto(v: FormDataEntryValue | null): Photo | undefined {
  if (typeof v !== "string") return undefined;
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(v);
  if (!m) return undefined;
  const mime = m[1] === "image/jpg" ? "image/jpeg" : (m[1] as string);
  const data = m[2] ?? "";
  return data.length > 0 && data.length <= 4_000_000 ? { base64: data, mime } : undefined;
}

type ExtraInput = { name: string; role: string; appearance?: string; photo?: Photo };

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
    format: formData.get("format") ? String(formData.get("format")) : undefined,
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
  const photoRef = lirePhoto(formData.get("photo"));

  // Autres personnages (famille, doudou, animal) : jusqu'à 3.
  const extras: ExtraInput[] = [];
  for (let i = 0; i < 3; i++) {
    const nom = String(formData.get(`extra_${i}_name`) ?? "").trim();
    if (!nom) continue;
    const e = extraSchema.safeParse({
      name: nom,
      role: String(formData.get(`extra_${i}_role`) ?? ""),
      appearance: String(formData.get(`extra_${i}_appearance`) ?? "").trim() || undefined,
    });
    if (!e.success) return { ok: false, message: e.error.issues[0]?.message ?? "Personnage invalide." };
    for (const t of [e.data.name, e.data.appearance].filter((x): x is string => Boolean(x))) {
      const check = checkUserText(t);
      if (!check.ok) return { ok: false, message: check.message };
    }
    extras.push({ ...e.data, photo: lirePhoto(formData.get(`extra_${i}_photo`)) });
  }


  // Vérifie que l'enfant appartient bien à l'utilisateur.
  const child = await prisma.child.findFirst({
    where: { id: input.childId, userId: user.id },
  });
  if (!child) return { ok: false, message: "Enfant introuvable." };

  // Le type de livre doit convenir à l'âge de l'enfant.
  if (!formatsPourAge(child.age).some((f) => f.id === input.format)) {
    const f = findFormat(input.format);
    return {
      ok: false,
      message: `« ${f?.label ?? "Ce format"} » est prévu pour les ${f?.ageMin}–${f?.ageMax} ans. Choisissez un autre type de livre.`,
    };
  }

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
      format: input.format,
      extras,
    }),
  );

  revalidatePath("/bibliotheque");
  return { ok: true, message: "La création de votre livre a commencé.", bookId: book.id };
}

type GenerationInput = Omit<Parameters<typeof generateStory>[0], "appearance" | "extras"> & {
  appearance: string;
  extras: ExtraInput[];
};

/** Sujet de la photo, pour la description d'apparence. */
function sujetPhoto(role: string): string {
  if (role === "doudou") return "plush toy";
  if (role === "animal de compagnie") return "pet animal";
  if (["maman", "papa", "mamie", "papi"].includes(role)) return "adult person";
  return "child";
}

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

    // Apparence des autres personnages : décrite depuis leur photo (jamais stockée).
    const extras = await Promise.all(
      req.extras.map(async (e) => ({
        name: e.name,
        role: e.role,
        appearance:
          e.appearance ?? (e.photo ? await describeChildFromPhoto(e.photo, sujetPhoto(e.role)) : undefined),
      })),
    );

    const result = await generateStory({
      ...req,
      appearance: appearance.length > 0 ? appearance : undefined,
      extras: extras.map((e) => ({ ...e, appearance: e.appearance || undefined })),
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
