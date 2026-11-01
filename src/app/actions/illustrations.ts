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
import { imageReportOf } from "@/lib/storyGenerator";
import { EN_COURS } from "@/lib/illustrationStatus";


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
