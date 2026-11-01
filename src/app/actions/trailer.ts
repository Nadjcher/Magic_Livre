"use server";

/**
 * Bande-annonce vidéo : lancement, suivi et nouvel essai d'une scène.
 * Réservée aux acheteurs du produit « video » (ou de la formule Tout compris).
 */

import { waitUntil } from "@vercel/functions";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { storySchema, type Story, type Trailer } from "@/lib/storySchema";
import { skusDonnantAcces } from "@/lib/products";
import { ESSAIS_MAX, choisirSources, ecrireScript, rafraichir, soumettreClip, voixOff } from "@/lib/trailer";

export interface TrailerState {
  ok: boolean;
  message?: string;
  trailer?: Trailer | null;
}

async function chargerLivrePaye(bookId: string) {
  const user = await getCurrentUser();
  if (!user) return { erreur: "Vous devez être connecté." } as const;
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id, deletedAt: null, status: "ready" },
    include: { child: { select: { firstName: true } } },
  });
  if (!book) return { erreur: "Livre introuvable." } as const;
  const paye = await prisma.order.findFirst({
    where: { bookId, userId: user.id, status: "paid", sku: { in: skusDonnantAcces("video") } },
    select: { id: true },
  });
  if (!paye) return { erreur: "La bande-annonce nécessite un achat." } as const;
  const parsed = storySchema.safeParse(book.pages);
  if (!parsed.success) return { erreur: "Le contenu de ce livre est illisible." } as const;
  return { book, story: parsed.data } as const;
}

/** Enregistre la bande-annonce en relisant le livre (pour ne rien écraser). */
async function sauver(bookId: string, trailer: Trailer): Promise<void> {
  const frais = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true } });
  const p = storySchema.safeParse(frais?.pages);
  if (!p.success) return;
  // Même bande-annonce déjà enregistrée : on fusionne scène par scène (deux
  // mises à jour simultanées ne s'effacent pas : clips d'un côté, voix de l'autre).
  const ancien = p.data.video;
  const fusion: Trailer =
    ancien && ancien.creeLe === trailer.creeLe
      ? {
          ...trailer,
          scenes: trailer.scenes.map((x, i) => {
            const a = ancien.scenes[i];
            if (!a) return x;
            return {
              ...x,
              phrase: x.phrase || a.phrase,
              statusUrl: x.statusUrl ?? a.statusUrl,
              responseUrl: x.responseUrl ?? a.responseUrl,
              clipUrl: x.clipUrl ?? a.clipUrl,
              audioUrl: x.audioUrl ?? a.audioUrl,
              erreur: x.erreur === null ? null : x.erreur ?? a.erreur,
            };
          }),
        }
      : trailer;
  const maj: Story = { ...p.data, video: fusion };
  await prisma.book.update({ where: { id: bookId }, data: { pages: maj } });
}

export async function startTrailer(bookId: string): Promise<TrailerState> {
  const r = await chargerLivrePaye(bookId);
  if ("erreur" in r) return { ok: false, message: r.erreur };
  const { book, story } = r;

  const essais = story.video?.essais ?? 0;
  if (essais >= ESSAIS_MAX) {
    return { ok: false, message: "Nombre maximal de créations atteint pour ce livre. Écrivez-nous si besoin." };
  }
  if (story.pages.filter((p) => p.imageUrl).length < 3) {
    return { ok: false, message: "Il faut d'abord les illustrations du livre." };
  }

  const sources = choisirSources(story);
  // Bande-annonce « en préparation » visible tout de suite.
  const initiale: Trailer = {
    creeLe: Date.now(),
    essais: essais + 1,
    scenes: sources.map((source) => ({ source, phrase: "" })),
  };
  await sauver(book.id, initiale);

  waitUntil(
    (async () => {
      const phrases = await ecrireScript(story, book.child.firstName, sources);
      // Animations en file d'attente chez fal (en parallèle)…
      const clips = await Promise.all(sources.map((source) => soumettreClip(story, source)));
      await sauver(book.id, {
        ...initiale,
        scenes: sources.map((source, i) => {
          const c = clips[i]!;
          return { source, phrase: phrases[i]!, ...("erreur" in c ? { erreur: c.erreur } : c) };
        }),
      });
      // …puis voix off une par une (fal limite les requêtes simultanées).
      const voix: (string | null)[] = [];
      for (const p of phrases) voix.push(await voixOff(p));
      const frais = await prisma.book.findUnique({ where: { id: book.id }, select: { pages: true } });
      const actuel = storySchema.safeParse(frais?.pages);
      const t = actuel.success && actuel.data.video ? actuel.data.video : null;
      if (t) await sauver(book.id, { ...t, scenes: t.scenes.map((x, i) => ({ ...x, audioUrl: voix[i] ?? null })) });
    })().catch((e) => console.error("[trailer]", String(e).slice(0, 200))),
  );

  return { ok: true, trailer: initiale };
}

export async function trailerStatus(bookId: string): Promise<TrailerState> {
  const r = await chargerLivrePaye(bookId);
  if ("erreur" in r) return { ok: false, message: r.erreur };
  const t = r.story.video;
  if (!t) return { ok: true, trailer: null };
  const { trailer, change } = await rafraichir(t);
  if (change) await sauver(bookId, trailer);
  return { ok: true, trailer };
}

/** Relance l'animation d'une scène en échec (une demande échouée n'est pas facturée). */
export async function retryScene(bookId: string, index: number): Promise<TrailerState> {
  const r = await chargerLivrePaye(bookId);
  if ("erreur" in r) return { ok: false, message: r.erreur };
  const t = r.story.video;
  const s = t?.scenes[index];
  if (!t || !s || !s.erreur) return { ok: false, message: "Rien à relancer." };
  const clip = await soumettreClip(r.story, s.source);
  const audioUrl = s.audioUrl ?? (s.phrase ? await voixOff(s.phrase) : null);
  const scenes = t.scenes.map((x, k) =>
    k === index ? { ...x, audioUrl, erreur: null, ...("erreur" in clip ? { erreur: clip.erreur } : clip) } : x,
  );
  const maj = { ...t, scenes };
  await sauver(bookId, maj);
  return { ok: true, trailer: maj };
}
