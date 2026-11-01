"use server";

/**
 * « Le livre en dessin animé » : lancement, suivi et nouvel essai d'une scène.
 * Réservé aux acheteurs du produit « video » (ou de la formule Tout compris).
 */

import { waitUntil } from "@vercel/functions";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { storySchema, type Story, type Trailer } from "@/lib/storySchema";
import { skusDonnantAcces } from "@/lib/products";
import { ESSAIS_MAX, choisirSources, rafraichir, soumettreClip, textesLus, voixOff } from "@/lib/trailer";

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
  if (!paye) return { erreur: "Le dessin animé nécessite un achat." } as const;
  const parsed = storySchema.safeParse(book.pages);
  if (!parsed.success) return { erreur: "Le contenu de ce livre est illisible." } as const;
  return { book, story: parsed.data } as const;
}

type Scene = Trailer["scenes"][number];

/** Fusionne deux versions d'une même scène (aucune information perdue). */
function fusionScene(x: Scene, a: Scene | undefined): Scene {
  if (!a) return x;
  return {
    ...x,
    phrase: x.phrase || a.phrase,
    statusUrl: x.statusUrl ?? a.statusUrl,
    responseUrl: x.responseUrl ?? a.responseUrl,
    clipUrl: x.clipUrl ?? a.clipUrl,
    audioUrl: x.audioUrl ?? a.audioUrl,
    audioSec: x.audioSec ?? a.audioSec,
    clipSec: x.clipSec ?? a.clipSec,
    erreur: x.erreur === null ? null : x.erreur ?? a.erreur,
  };
}

/**
 * Enregistre la création en relisant le livre : deux mises à jour simultanées
 * (suivi d'un côté, voix ou relance de l'autre) ne s'effacent pas.
 */
async function sauver(bookId: string, trailer: Trailer): Promise<void> {
  const frais = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true } });
  const p = storySchema.safeParse(frais?.pages);
  if (!p.success) return;
  const ancien = p.data.video;
  const fusion: Trailer =
    ancien && ancien.creeLe === trailer.creeLe
      ? {
          ...trailer,
          scenes: trailer.scenes.map((x, i) => fusionScene(x, ancien.scenes[i])),
          finalStatusUrl: trailer.finalStatusUrl ?? ancien.finalStatusUrl,
          finalResponseUrl: trailer.finalResponseUrl ?? ancien.finalResponseUrl,
          finalUrl: trailer.finalUrl ?? ancien.finalUrl,
          finalErreur: trailer.finalErreur === null ? null : trailer.finalErreur ?? ancien.finalErreur,
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
  const textes = textesLus(story, book.child.firstName, sources);
  const initiale: Trailer = {
    creeLe: Date.now(),
    essais: essais + 1,
    scenes: sources.map((source, i) => ({ source, phrase: textes[i]! })),
  };
  await sauver(book.id, initiale);

  waitUntil(
    (async () => {
      // 1. Voix off, une par une (fal limite les requêtes simultanées) : leur
      //    durée décide de la longueur des clips (5 ou 10 s).
      const voix: ({ url: string; sec: number } | null)[] = [];
      for (const t of textes) voix.push(await voixOff(t));
      // 2. Animations en file d'attente chez fal.
      const clips = await Promise.all(
        sources.map((source, i) => {
          // 5 s si la phrase tient dedans, sinon 10 s (le clip est rejoué au besoin).
          const sec = (voix[i]?.sec ?? 4) + 1.2 <= 5 ? 5 : 10;
          return soumettreClip(story, source, sec).then((c) => ({ c, sec }));
        }),
      );
      await sauver(book.id, {
        ...initiale,
        scenes: sources.map((source, i) => {
          const { c, sec } = clips[i]!;
          return {
            source,
            phrase: textes[i]!,
            audioUrl: voix[i]?.url ?? null,
            // 0 = pas de voix pour cette scène (la vidéo reste montable).
            audioSec: voix[i]?.sec ?? 0,
            clipSec: sec,
            ...("erreur" in c ? { erreur: c.erreur } : c),
          };
        }),
      });
    })().catch((e) => console.error("[dessin animé]", String(e).slice(0, 200))),
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
  const sec = (s.clipSec === 10 ? 10 : 5) as 5 | 10;
  const clip = await soumettreClip(r.story, s.source, sec);
  const scenes = t.scenes.map((x, k) =>
    k === index ? { ...x, erreur: null, ...("erreur" in clip ? { erreur: clip.erreur } : clip) } : x,
  );
  // Le montage sera relancé une fois toutes les scènes prêtes.
  const maj: Trailer = { ...t, scenes, finalErreur: null, finalStatusUrl: null, finalResponseUrl: null, finalUrl: null };
  await sauverRemplace(bookId, maj);
  return { ok: true, trailer: maj };
}

/** Remplace la création telle quelle (utilisé quand on efface volontairement des champs). */
async function sauverRemplace(bookId: string, trailer: Trailer): Promise<void> {
  const frais = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true } });
  const p = storySchema.safeParse(frais?.pages);
  if (!p.success) return;
  await prisma.book.update({ where: { id: bookId }, data: { pages: { ...p.data, video: trailer } } });
}

/** Relance uniquement le montage final (s'il a échoué). */
export async function retryMontage(bookId: string): Promise<TrailerState> {
  const r = await chargerLivrePaye(bookId);
  if ("erreur" in r) return { ok: false, message: r.erreur };
  const t = r.story.video;
  if (!t || !t.finalErreur) return { ok: false, message: "Rien à relancer." };
  const maj: Trailer = { ...t, finalErreur: null, finalStatusUrl: null, finalResponseUrl: null, finalUrl: null };
  await sauverRemplace(bookId, maj);
  return { ok: true, trailer: maj };
}
