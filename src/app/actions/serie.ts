"use server";

/** « Et demain ? » : crée l'épisode suivant d'une série, avec la suite choisie par l'enfant. */

import { waitUntil } from "@vercel/functions";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/rateLimit";
import { checkUserText } from "@/lib/validation";
import { getAbonnement } from "@/lib/subscription";
import { reserver, liberer } from "@/lib/idempotence";
import { plafondGratuitAtteint, noterLivreGratuit } from "@/lib/apercu";
import { generateStory } from "@/lib/storyGenerator";
import { lireFiche } from "@/lib/ficheEnfant";
import { lancerRelecture } from "@/lib/livraison";
import { EPISODES_PAR_MOIS, episodesDuMois, memoire, moisParis, serieDe } from "@/lib/serie";
import type { StoryRequest } from "@/lib/storyPrompt";
import type { IllustrationStyle } from "@/lib/style_config";

export async function creerEpisode(
  bookId: string,
  choixBrut: string,
): Promise<{ ok: boolean; message: string; bookId?: string; club?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };
  const choix = choixBrut.replace(/\s+/g, " ").trim().slice(0, 200);
  if (choix.length < 3) return { ok: false, message: "Dites-nous ce qui se passe ensuite." };
  const check = checkUserText(choix);
  if (!check.ok) return { ok: false, message: check.message };

  const livre = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id, deletedAt: null, status: "ready" },
    select: { childId: true, tier: true, child: { select: { firstName: true, age: true } } },
  });
  if (!livre) return { ok: false, message: "Livre introuvable." };
  const serie = await serieDe(user.id, bookId);
  if (!serie) return { ok: false, message: "Cette histoire ne peut pas encore avoir de suite." };

  // Quotas : Club (épisodes par mois), sinon un épisode découverte par compte.
  const admin = estAdmin(user.email);
  const ab = await getAbonnement(user.id);
  let cleDecouverte: string | null = null;
  if (!admin) {
    if (ab.actif) {
      if ((await episodesDuMois(user.id)) >= EPISODES_PAR_MOIS()) {
        return { ok: false, message: `Vous avez lu vos ${EPISODES_PAR_MOIS()} épisodes du mois. La suite revient le mois prochain !` };
      }
    } else {
      if (await plafondGratuitAtteint()) {
        return { ok: false, message: "Tous les épisodes gratuits du jour sont partis ! Revenez demain, ou rejoignez le Club.", club: true };
      }
      cleDecouverte = `episode-decouverte:${user.id}`;
      if (!(await reserver(cleDecouverte))) {
        return { ok: false, message: "La suite de la série est réservée aux membres du Club.", club: true };
      }
    }
  }

  const m = memoire(serie, choix);
  const book = await prisma.book.create({
    data: {
      userId: user.id,
      childId: livre.childId,
      title: `Épisode ${m.numero} en cours…`,
      theme: `Série · épisode ${m.numero}`,
      status: "generating",
      tier: livre.tier,
    },
    select: { id: true },
  });
  if (ab.actif || admin) await reserver(`episode:${user.id}:${moisParis()}:${book.id}`);
  else await noterLivreGratuit(book.id);

  const req: StoryRequest = {
    childFirstName: livre.child.firstName,
    childAge: livre.child.age,
    mode: "libre",
    prompt: choix,
    longueur: "courte",
    style: (serie.racine.style ?? "feerique") as IllustrationStyle,
    format: serie.racine.meta?.format,
    premium: livre.tier === "premium",
    serie: m,
    childId: livre.childId,
    fiche: await lireFiche(livre.childId),
  };
  waitUntil(genererEpisode(book.id, req, serie.id, cleDecouverte));
  revalidatePath("/bibliotheque");
  return { ok: true, message: "L'épisode s'écrit…", bookId: book.id };
}

async function genererEpisode(bookId: string, req: StoryRequest, serieId: string, cleDecouverte: string | null): Promise<void> {
  try {
    const result = await generateStory(req, { illustrer: false, relire: false });
    if (!result.ok) {
      if (cleDecouverte) await liberer(cleDecouverte); // l'épisode découverte reste disponible
      await prisma.book.update({ where: { id: bookId }, data: { status: "failed", errorMessage: result.message } });
      return;
    }
    // Les fiches et le style de la série sont repris : mêmes personnages, même dessin.
    const racine = await prisma.book.findUnique({ where: { id: serieId }, select: { pages: true } });
    const { storySchema } = await import("@/lib/storySchema");
    const r = storySchema.safeParse(racine?.pages);
    const complement = {
      serie: { id: serieId, numero: req.serie!.numero },
      style: r.success ? r.data.style ?? result.story.style : result.story.style,
      fiches: r.success ? r.data.fiches : undefined,
    };
    await lancerRelecture({ bookId, req, portrait: null, complement, tentative: 1 }, result.story);
  } catch (e) {
    console.error("[série] épisode interrompu", bookId, String(e).slice(0, 300));
    if (cleDecouverte) await liberer(cleDecouverte).catch(() => undefined);
    await prisma.book
      .update({ where: { id: bookId }, data: { status: "failed", errorMessage: "L'épisode n'a pas pu être écrit. Réessayez." } })
      .catch(() => undefined);
  }
}
