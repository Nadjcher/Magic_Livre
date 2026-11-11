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
import sharp from "sharp";
import { plafondGratuitAtteint, noterLivreGratuit } from "@/lib/apercu";
import { lireFiche } from "@/lib/ficheEnfant";
import { lirePhoto } from "@/lib/photo";
import { herosValide, lireHeros, lireHerosParId, refHeros, validerHeros } from "@/lib/heros";
import { waitUntil } from "@vercel/functions";
import { getCurrentUser, hasParentalConsent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { childSchema, createBookSchema, checkUserText, extraSchema } from "@/lib/validation";
import { env } from "@/lib/env";
import { findFormat, formatsPourAge } from "@/lib/bookFormats";
import { checkDailyBookLimit, estAdmin } from "@/lib/rateLimit";
import { generateStory } from "@/lib/storyGenerator";
import { lancerRelecture } from "@/lib/livraison";
import { describeChildFromPhoto } from "@/lib/illustration";
import { estClassique, findThemeById } from "@/lib/themes";
import { getAbonnement, inclureLivre } from "@/lib/subscription";
import type { LongueurKey } from "@/lib/validation";
import { stylesPourAge, type IllustrationStyle } from "@/lib/style_config";

export interface CreateBookResult {
  ok: boolean;
  message: string;
  /** Identifiant du livre créé (même en cas d'échec de génération). */
  bookId?: string;
}

type Photo = { base64: string; mime: string };

/**
 * Lit une photo envoyée en data URL et la RÉ-ENCODE côté serveur : on vérifie
 * que c'est une vraie image (pas seulement son type déclaré), on la limite à
 * 1 024 px et on supprime TOUTES ses métadonnées (EXIF : position GPS, date,
 * appareil). La photo n'est jamais enregistrée.
 */

type ExtraInput = { name: string; role: string; appearance?: string; photo?: Photo };

export async function createBook(formData: FormData): Promise<CreateBookResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  // Règle non négociable : pas de création sans consentement parental. Il peut
  // être donné dans le formulaire lui-même (case cochée), enregistré avec sa date
  // et la version des CGU.
  if (!hasParentalConsent(user)) {
    if (formData.get("consent") !== "on") {
      return {
        ok: false,
        message: "Cochez la case de consentement parental pour créer le livre.",
      };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { parentalConsentAt: new Date(), termsVersion: env.termsVersion() },
    });
  }

  // Nouvel enfant saisi directement dans le formulaire (prénom + âge).
  if (String(formData.get("childId") ?? "") === "nouveau") {
    const nouveau = childSchema.safeParse({
      firstName: String(formData.get("newChildName") ?? ""),
      age: Number(formData.get("newChildAge")),
    });
    if (!nouveau.success) return { ok: false, message: nouveau.error.issues[0]?.message ?? "Prénom ou âge invalide." };
    const verif = checkUserText(nouveau.data.firstName);
    if (!verif.ok) return { ok: false, message: verif.message };
    const deja = await prisma.child.findFirst({
      where: { userId: user.id, firstName: nouveau.data.firstName, age: nouveau.data.age },
      select: { id: true },
    });
    const enfant = deja ?? (await prisma.child.create({ data: { userId: user.id, firstName: nouveau.data.firstName, age: nouveau.data.age }, select: { id: true } }));
    formData.set("childId", enfant.id);
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
  const photoRef = await lirePhoto(formData.get("photo"));

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
    extras.push({ ...e.data, photo: await lirePhoto(formData.get(`extra_${i}_photo`)) });
  }


  // Vérifie que l'enfant appartient bien à l'utilisateur.
  const child = await prisma.child.findFirst({
    where: { id: input.childId, userId: user.id },
  });
  if (!child) return { ok: false, message: "Enfant introuvable." };

  // Le style de dessin doit convenir à l'âge (pas de manga pour un tout-petit).
  if (!stylesPourAge(child.age).includes(input.style as IllustrationStyle)) {
    return { ok: false, message: "Ce style de dessin n'est pas proposé pour cet âge. Choisissez-en un autre." };
  }
  // Héros validé par le parent (« Est-ce bien votre enfant ? »), ou déjà validé
  // pour cet enfant et ce style : les pages sont dessinées avec lui, sans photo.
  let herosRetenu: { id: string; traits: string } | null = null;
  const herosId = String(formData.get("herosId") ?? "");
  if (herosId) {
    const h = await lireHeros(herosId, user.id);
    if (h && h.style === input.style) {
      const traits = String(formData.get("herosTraits") ?? h.traits).replace(/\s+/g, " ").trim().slice(0, 240);
      if (traits) {
        const check = checkUserText(traits);
        if (!check.ok) return { ok: false, message: check.message };
      }
      await validerHeros(h.id, user.id, child.id, traits);
      herosRetenu = { id: h.id, traits };
    }
  }
  if (!herosRetenu && !photoRef) {
    const h = await herosValide(child.id, input.style);
    if (h) herosRetenu = { id: h.id, traits: h.traits };
  }


  // Le type de livre doit convenir à l'âge de l'enfant.
  if (!formatsPourAge(child.age).some((f) => f.id === input.format)) {
    const f = findFormat(input.format);
    return {
      ok: false,
      message: `« ${f?.label ?? "Ce format"} » est prévu pour les ${f?.ageMin}–${f?.ageMax} ans. Choisissez un autre type de livre.`,
    };
  }

  // Anti-abus : tant que l'adresse email n'est pas confirmée, un seul livre
  // (sinon, des comptes jetables pourraient générer des livres en masse).
  if (!user.emailVerified && !estAdmin(user.email)) {
    const deja = await prisma.book.count({ where: { userId: user.id } });
    if (deja >= 1) {
      return {
        ok: false,
        message:
          "Confirmez votre adresse email pour créer d'autres livres : cliquez sur le lien reçu par email (ou renvoyez-le depuis « Mon compte »).",
      };
    }
  }

  // Abonnement Club : grands classiques réservés, livres inclus, premium (Club+).
  const abonnement = await getAbonnement(user.id);

  // Limite quotidienne pour contrôler les coûts (sauf livres inclus dans le Club,
  // déjà plafonnés par le quota mensuel : un membre peut recevoir sa sélection d'un coup).
  // Livre gratuit (ni Club, ni admin) : un aperçu, dans la limite du plafond du jour.
  const gratuit = !(abonnement.actif && abonnement.restants > 0) && !estAdmin(user.email);
  if (!(abonnement.actif && abonnement.restants > 0)) {
    const limit = await checkDailyBookLimit(user.id, user.email);
    if (!limit.allowed) return { ok: false, message: limit.message };
  }
  if (gratuit && (await plafondGratuitAtteint())) {
    return {
      ok: false,
      message:
        "Victimes de notre succès : tous les livres gratuits du jour sont partis ! Revenez demain matin, ou rejoignez le Club pour créer vos livres tout de suite.",
    };
  }
  if (input.mode === "theme" && estClassique(findThemeById(input.themeId)) && !abonnement.actif) {
    return { ok: false, message: "Les grands classiques revisités sont réservés aux membres du Club." };
  }

  // Détermine un thème lisible pour l'affichage.
  const theme =
    input.mode === "theme"
      ? findThemeById(input.themeId)?.titre ?? "Histoire personnalisée"
      : "Aventure personnalisée";

  // Édition choisie : premium = illustrations haut de gamme + prix supérieur.
  const premium =
    abonnement.premium || formData.get("premium") === "on" || formData.get("premium") === "true";

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
  const inclus = await inclureLivre(user.id, book.id, abonnement);
  const apercu = !inclus && !estAdmin(user.email);
  if (apercu) await noterLivreGratuit(book.id);

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
      photo: herosRetenu ? undefined : photoRef,
      herosId: herosRetenu?.id,
      premium,
      apercu,
      format: input.format,
      extras,
      childId: child.id,
      fiche: await lireFiche(child.id),
    }),
  );

  revalidatePath("/bibliotheque");
  return {
    ok: true,
    message: inclus
      ? "La création a commencé. Ce livre est inclus dans votre abonnement."
      : "La création de votre livre a commencé.",
    bookId: book.id,
  };
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
    // Héros validé : son portrait sert d'ancre à toutes les pages, ses traits sont imposés.
    const heros = req.herosId ? await lireHerosParId(req.herosId) : null;
    const portraitHeros = heros ? await refHeros(heros) : null;
    let appearance = heros?.traits || req.appearance;
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

    // Étape 1 : le texte (enregistré tout de suite, le livre reste « en cours »).
    const reqGeneration = {
      ...req,
      appearance: appearance.length > 0 ? appearance : undefined,
      extras: extras.map((e) => ({ ...e, appearance: e.appearance || undefined })),
    };
    const result = await generateStory(reqGeneration, { illustrer: false, relire: false });

    if (!result.ok) {
      await prisma.book.update({
        where: { id: bookId },
        data: { status: "failed", errorMessage: result.message },
      });
      return;
    }

    // Étape 2 : livraison (illustrations dans une nouvelle exécution), ou nouvelle
    // génération / relecture humaine si la relecture a trouvé un motif éliminatoire.
    await lancerRelecture(
      { bookId, req: { ...reqGeneration, extras: reqGeneration.extras }, portrait: portraitHeros ?? result.portrait ?? null, tentative: 1 },
      result.story,
    );
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
