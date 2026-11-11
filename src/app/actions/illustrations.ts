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

  await prisma.book.update({
    where: { id: book.id },
    data: { errorMessage: `${EN_COURS}${Date.now()}` },
  });

  waitUntil(
    completer(book.id, parsed.data, book.child.firstName, book.tier === "premium"),
  );
  revalidatePath(`/bibliotheque/${book.id}`);
  return { ok: true, message: "C'est parti ! Les illustrations arrivent dans 1 à 2 minutes." };
}

async function completer(
  bookId: string,
  story: Story,
  heroName: string,
  premium: boolean,
): Promise<void> {
  const errors: string[] = [];
  try {
    const style = story.style ?? "feerique";
    // Ancre = une illustration déjà réussie du livre (même héros, même style).
    const ancreUrl =
      (await fetchAsDataUrl(story.couvertureUrl, { maxPx: 1024, quality: 85 })) ??
      (await fetchAsDataUrl(story.pages.find((p) => p.imageUrl)?.imageUrl, {
        maxPx: 1024,
        quality: 85,
      }));
    const m = ancreUrl ? /^data:([^;]+);base64,(.+)$/.exec(ancreUrl) : null;
    const anchor = m ? { mime: m[1] as string, base64: m[2] as string } : undefined;

    const base = Date.now() % 1_000_000;
    const dessiner = (scene: string, seed: number) =>
      generateIllustration({
        style,
        scene,
        heroName,
        anchorImage: anchor,
        premium,
        recurringCharacters: story.personnages,
        seed,
      }).then((r) => {
        if (r.error) errors.push(r.error);
        return r.imageUrl;
      });

    const taches: { cible: "cover" | number; scene: string }[] = [];
    if (!story.couvertureUrl) {
      taches.push({
        cible: "cover",
        scene:
          `Book cover illustration for the story "${story.titre}": the hero in an emblematic moment ` +
          `(${story.pages[Math.floor(story.pages.length / 2)]?.scene_illustration ?? ""}), NOT a plain portrait`,
      });
    }
    story.pages.forEach((p, i) => {
      if (!p.imageUrl) taches.push({ cible: i, scene: p.scene_illustration });
    });

    const resultats = new Map<"cover" | number, string | null>();
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(4, taches.length) }, async () => {
        while (next < taches.length) {
          const t = taches[next++]!;
          resultats.set(t.cible, await dessiner(t.scene, base + next));
        }
      }),
    );

    // Relit le livre (il a pu être allégé entre-temps) puis complète.
    const frais = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true } });
    const actuel = storySchema.safeParse(frais?.pages);
    const cible = actuel.success ? actuel.data : story;
    const complete: Story = {
      ...cible,
      couvertureUrl: cible.couvertureUrl ?? resultats.get("cover") ?? null,
      pages: cible.pages.map((p, i) => ({ ...p, imageUrl: p.imageUrl ?? resultats.get(i) ?? null })),
    };
    await prisma.book.update({
      where: { id: bookId },
      data: { pages: complete, errorMessage: imageReportOf(complete, errors) ?? null },
    });
  } catch (e) {
    await prisma.book
      .update({
        where: { id: bookId },
        data: { errorMessage: `Illustrations manquantes. ${String(e).slice(0, 200)}` },
      })
      .catch(() => undefined);
  }
}

/** Nombre de pages qu'on peut redessiner gratuitement par livre. */
const RETOUCHES_MAX = 5;

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
  if (faites >= RETOUCHES_MAX) {
    return { ok: false, message: `Vous avez déjà redessiné ${RETOUCHES_MAX} pages de ce livre.`, restantes: 0 };
  }
  const page = index >= 0 ? story.pages[index] : undefined;
  if (index >= 0 && !page) return { ok: false, message: "Page introuvable." };
  if (page && !page.imageUrl && story.apercu) {
    return { ok: false, message: "Cette page sera illustrée avec le livre complet." };
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

  // Relit le livre avant d'écrire (rien d'autre ne doit être écrasé).
  const frais = await prisma.book.findUnique({ where: { id: book.id }, select: { pages: true } });
  const actuel = storySchema.safeParse(frais?.pages);
  const cible = actuel.success ? actuel.data : story;
  const maj: Story = {
    ...cible,
    retouches: faites + 1,
    couvertureUrl: index < 0 ? r.imageUrl : cible.couvertureUrl,
    pages: cible.pages.map((p, i) => (i === index ? { ...p, imageUrl: r.imageUrl } : p)),
  };
  await prisma.book.update({ where: { id: book.id }, data: { pages: maj } });
  revalidatePath(`/bibliotheque/${book.id}`);
  return { ok: true, message: "Nouvelle illustration prête !", restantes: RETOUCHES_MAX - faites - 1 };
}
