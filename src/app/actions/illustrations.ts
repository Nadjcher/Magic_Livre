"use server";

/**
 * Complète les illustrations manquantes d'un livre (Gemini indisponible,
 * crédits épuisés au moment de la création…) SANS réécrire l'histoire ni
 * redessiner les images déjà réussies : on ne paie que les images absentes.
 */

import { waitUntil } from "@vercel/functions";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { storySchema, type Story } from "@/lib/storySchema";
import { generateIllustration } from "@/lib/illustration";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { fichesPresentes, illustrerEpisode, imageReportOf } from "@/lib/storyGenerator";
import { EN_COURS } from "@/lib/illustrationStatus";
import { debloquerLivre, peutDebloquer } from "@/lib/apercu";
import { retouchesMax } from "@/lib/validationImpression";
import { controleActif, controlerIllustrations } from "@/lib/controleIllustrations";

const REFUS_DESSIN = "Le nouveau dessin n'était pas assez réussi : nous ne l'avons pas gardé, et cet essai n'est pas compté. Réessayez dans un instant.";


function manquantes(story: Story): number {
  return (story.couvertureUrl ? 0 : 1) + story.pages.filter((p) => !p.imageUrl).length;
}

export async function completeIllustrations(
  bookId: string,
): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id, deletedAt: null, status: "ready" },
    include: { child: { select: { firstName: true } } },
  });
  if (!book) return { ok: false, message: "Livre introuvable." };
  if (book.errorMessage?.startsWith(EN_COURS)) {
    return { ok: true, message: "Les illustrations sont déjà en cours de création." };
  }
  const parsed = storySchema.safeParse(book.pages);
  if (!parsed.success) return { ok: false, message: "Le contenu de ce livre est illisible." };
  // Aperçu gratuit : tout le livre est illustré à l'achat ou avec le Club.
  if (parsed.data.apercu) {
    if (!(await peutDebloquer(user.id, book.id))) {
      return { ok: false, message: "Le livre entièrement illustré arrive avec l'achat du livre ou le Club." };
    }
    waitUntil(debloquerLivre(book.id));
    revalidatePath(`/bibliotheque/${book.id}`);
    return { ok: true, message: "C'est parti ! Toutes les illustrations arrivent dans 1 à 2 minutes." };
  }
  // Épisode de série : une seule image (l'ouverture) ; les pages restent en texte.
  if (parsed.data.serie) {
    if (parsed.data.couvertureUrl) return { ok: true, message: "L'illustration de l'épisode est là." };
    await prisma.book.update({ where: { id: book.id }, data: { errorMessage: `${EN_COURS}${Date.now()}` } });
    const story = parsed.data;
    waitUntil(
      illustrerEpisode(story, { childFirstName: book.child.firstName, childAge: 6, mode: "libre", longueur: "courte", premium: book.tier === "premium" })
        .then(({ story: s2, imageReport }) =>
          prisma.book.update({ where: { id: book.id }, data: { pages: { ...story, couvertureUrl: s2.couvertureUrl ?? null }, errorMessage: imageReport ?? null } }),
        )
        .catch(() => prisma.book.update({ where: { id: book.id }, data: { errorMessage: null } })),
    );
    revalidatePath(`/bibliotheque/${book.id}`);
    return { ok: true, message: "C'est parti ! L'illustration arrive dans une minute." };
  }
  if (manquantes(parsed.data) === 0) return { ok: true, message: "Toutes les illustrations sont là." };

  // Les images manquantes repassent par la chaîne normale : mêmes fiches (ou mêmes planches validées),
  // même vérification, même porte de qualité. Le livre redevient « en cours » le temps de les dessiner.
  await prisma.book.update({
    where: { id: book.id },
    data: { status: "generating", errorMessage: `${EN_COURS}${Date.now()}` },
  });
  const { lancerIllustrations } = await import("@/lib/bookPipeline");
  waitUntil(
    lancerIllustrations({
      bookId: book.id,
      req: { childFirstName: book.child.firstName, childAge: 6, mode: "theme", longueur: "moyenne", style: parsed.data.style, premium: book.tier === "premium" },
      portrait: null,
    }),
  );
  revalidatePath(`/bibliotheque/${book.id}`);
  return { ok: true, message: "C'est parti ! Les illustrations arrivent dans quelques minutes." };
}

/**
 * Redessine UNE page (ou la couverture, index -1) avec les mêmes fiches de
 * personnages : pour corriger une illustration ratée sans refaire le livre.
 */
export async function redrawPage(
  bookId: string,
  index: number,
): Promise<{ ok: boolean; message: string; restantes?: number }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id, deletedAt: null, status: "ready" },
    include: { child: { select: { firstName: true } } },
  });
  if (!book) return { ok: false, message: "Livre introuvable." };
  const parsed = storySchema.safeParse(book.pages);
  if (!parsed.success) return { ok: false, message: "Le contenu de ce livre est illisible." };
  const story = parsed.data;
  const faites = story.retouches ?? 0;
  // 5 retouches par livre, et 2 de plus offertes pendant la validation du livre imprimé.
  const RETOUCHES_MAX = retouchesMax(story);
  if (faites >= RETOUCHES_MAX) {
    return { ok: false, message: `Vous avez déjà redessiné ${faites} pages de ce livre.`, restantes: 0 };
  }
  const page = index >= 0 ? story.pages[index] : undefined;
  if (index >= 0 && !page) return { ok: false, message: "Page introuvable." };
  if (page && !page.imageUrl && story.apercu) {
    return { ok: false, message: "Cette page sera illustrée avec le livre complet." };
  }

  // Histoire toute prête avec planches : on retouche à nouveau la planche validée (scène intacte).
  if (story.planches) {
    const { retoucherPage } = await import("@/lib/planches");
    let url = await retoucherPage(story, index);
    // Garde-fou : la page refaite est vérifiée comme les autres (et reprise une fois si besoin).
    // Fautive ou non vérifiée : elle n'entre pas dans le livre, et l'essai n'est pas compté.
    if (url && controleActif()) {
      const { controlerRetouches } = await import("@/lib/planches");
      const essai: Story = {
        ...story,
        couvertureUrl: index < 0 ? url : story.couvertureUrl,
        pages: story.pages.map((p, i) => (i === index ? { ...p, imageUrl: url } : p)),
        planches: { ...story.planches, retouchees: [index] },
        imagesARevoir: undefined,
      };
      const { story: verifiee } = await controlerRetouches(essai, Date.now() + 150_000);
      if ((verifiee.imagesARevoir?.length ?? 0) > 0 || (verifiee.controleImages?.nonVerifiees ?? 0) > 0) {
        return { ok: false, message: REFUS_DESSIN, restantes: RETOUCHES_MAX - faites };
      }
      url = (index < 0 ? verifiee.couvertureUrl : verifiee.pages[index]?.imageUrl) ?? url;
    }
    if (url) {
      const frais = storySchema.safeParse((await prisma.book.findUnique({ where: { id: book.id }, select: { pages: true } }))?.pages);
      const cible = frais.success ? frais.data : story;
      await prisma.book.update({
        where: { id: book.id },
        data: {
          pages: {
            ...cible,
            retouches: faites + 1,
            couvertureUrl: index < 0 ? url : cible.couvertureUrl,
            pages: cible.pages.map((p, i) => (i === index ? { ...p, imageUrl: url } : p)),
          },
        },
      });
      const { noterPageRefaite } = await import("@/lib/planches");
      await noterPageRefaite(book.id, story, index);
      revalidatePath(`/bibliotheque/${book.id}`);
      return { ok: true, message: "Nouvelle illustration prête !", restantes: RETOUCHES_MAX - faites - 1 };
    }
    // Une histoire toute prête ne se redessine jamais « à la main levée » : seulement depuis sa planche validée.
    return { ok: false, message: "Cette page ne peut pas être refaite pour l'instant. Réessayez plus tard.", restantes: RETOUCHES_MAX - faites };
  }

  // Fiches de référence (héros + personnages secondaires présents).
  const versRef = async (u: string | null | undefined) => {
    const d = await fetchAsDataUrl(u, { maxPx: 1024, quality: 86 });
    const m = d ? /^data:([^;]+);base64,(.+)$/.exec(d) : null;
    return m ? { mime: m[1] as string, base64: m[2] as string } : undefined;
  };
  const ancre = (await versRef(story.fiches?.heros)) ?? (await versRef(story.couvertureUrl));
  const fiches = new Map<string, { base64: string; mime: string }>();
  for (const [nom, url] of Object.entries(story.fiches?.cast ?? {})) {
    const r = await versRef(url);
    if (r) fiches.set(nom, r);
  }
  const castRefs = page
    ? fichesPresentes(page, fiches)
    : [...fiches.entries()].slice(0, 3).map(([name, f]) => ({ name, ...f }));

  const scene = page
    ? page.scene_illustration
    : `Book cover illustration for the story "${story.titre}": ${book.child.firstName} in an exciting, emblematic moment of the story, NOT a plain portrait`;
  const r = await generateIllustration({
    style: story.style ?? "feerique",
    scene,
    heroName: book.child.firstName,
    premium: book.tier === "premium",
    recurringCharacters: story.personnages,
    anchorImage: ancre,
    castRefs,
    seed: Date.now() % 1_000_000,
  });
  if (!r.imageUrl) {
    return { ok: false, message: "Le dessin n'a pas pu être refait. Réessayez dans un instant.", restantes: RETOUCHES_MAX - faites };
  }
  // Garde-fou : le nouveau dessin passe la même vérification que le reste du livre (avec ses reprises).
  // Fautif ou non vérifié : il n'entre pas dans le livre, et l'essai n'est pas compté.
  let nouvelle = r.imageUrl;
  if (controleActif() && story.fiches?.heros) {
    const seul: Story = {
      ...story,
      couvertureUrl: index < 0 ? nouvelle : null,
      pages: story.pages.map((p, i) => ({ ...p, imageUrl: i === index ? nouvelle : null })),
      controleImages: undefined,
      imagesARevoir: undefined,
    };
    const { story: verifiee } = await controlerIllustrations(
      seul,
      { childFirstName: book.child.firstName, childAge: 6, mode: "theme", longueur: "moyenne", style: story.style, premium: book.tier === "premium" },
      Date.now() + 150_000,
    );
    const c = verifiee.controleImages;
    if (!c || (c.nonVerifiees ?? 0) > 0 || (c.douteuses?.length ?? 0) > 0 || (verifiee.imagesARevoir?.length ?? 0) > 0) {
      return { ok: false, message: REFUS_DESSIN, restantes: RETOUCHES_MAX - faites };
    }
    nouvelle = (index < 0 ? verifiee.couvertureUrl : verifiee.pages[index]?.imageUrl) ?? nouvelle;
  }

  // Relit le livre avant d'écrire (rien d'autre ne doit être écrasé).
  const frais = await prisma.book.findUnique({ where: { id: book.id }, select: { pages: true } });
  const actuel = storySchema.safeParse(frais?.pages);
  const cible = actuel.success ? actuel.data : story;
  const maj: Story = {
    ...cible,
    retouches: faites + 1,
    couvertureUrl: index < 0 ? nouvelle : cible.couvertureUrl,
    pages: cible.pages.map((p, i) => (i === index ? { ...p, imageUrl: nouvelle } : p)),
  };
  await prisma.book.update({ where: { id: book.id }, data: { pages: maj } });
  // Boucle d'amélioration : on retient quelle page les parents font redessiner.
  const { noterPageRefaite } = await import("@/lib/planches");
  await noterPageRefaite(book.id, story, index);
  revalidatePath(`/bibliotheque/${book.id}`);
  return { ok: true, message: "Nouvelle illustration prête !", restantes: RETOUCHES_MAX - faites - 1 };
}
