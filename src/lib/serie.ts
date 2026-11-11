/**
 * Séries : chaque livre peut devenir le premier épisode d'une série. L'enfant
 * choisit la suite (« Et demain ? »), et l'épisode suivant est écrit avec la
 * mémoire de la série (résumés, personnages, fils ouverts) et illustré d'une
 * grande image avec les mêmes fiches de personnages.
 *
 * Quotas : membres du Club, SERIE_EPISODES_MOIS épisodes par mois (12 par
 * défaut) ; sans Club, un épisode « découverte » offert par compte.
 */

import "server-only";
import { prisma } from "./prisma";
import { storySchema, type Story } from "./storySchema";
import type { MemoireSerie } from "./storyPrompt";

export const EPISODES_PAR_MOIS = () => {
  const n = Number(process.env.SERIE_EPISODES_MOIS ?? "12");
  return Number.isFinite(n) && n > 0 ? n : 12;
};

export function moisParis(): string {
  return new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" }).slice(0, 7); // AAAA-MM
}

/** Épisodes déjà créés ce mois-ci par ce compte. */
export async function episodesDuMois(userId: string): Promise<number> {
  try {
    const [r] = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*)::bigint AS n FROM "Traitement" WHERE cle LIKE ${`episode:${userId}:${moisParis()}:%`}`;
    return Number(r?.n ?? 0);
  } catch {
    return 0;
  }
}

export interface Serie {
  id: string;
  /** Épisodes prêts, dans l'ordre. */
  episodes: { id: string; numero: number; story: Story }[];
  racine: Story;
}

/** Retrouve la série d'un livre (le livre seul = épisode 1). */
export async function serieDe(userId: string, bookId: string): Promise<Serie | null> {
  const livre = await prisma.book.findFirst({ where: { id: bookId, userId, deletedAt: null }, select: { pages: true } });
  const st = storySchema.safeParse(livre?.pages);
  if (!st.success) return null;
  const id = st.data.serie?.id ?? bookId;
  const livres = await prisma.book.findMany({
    where: {
      userId,
      deletedAt: null,
      status: "ready",
      OR: [{ id }, { pages: { path: ["serie", "id"], equals: id } }],
    },
    select: { id: true, pages: true },
  });
  const episodes = livres
    .map((l) => {
      const s = storySchema.safeParse(l.pages);
      return s.success ? { id: l.id, numero: l.id === id ? 1 : s.data.serie?.numero ?? 1, story: s.data } : null;
    })
    .filter((x): x is { id: string; numero: number; story: Story } => x !== null)
    .sort((a, b) => a.numero - b.numero);
  const racine = episodes.find((e) => e.id === id)?.story ?? episodes[0]?.story;
  if (!racine) return null;
  return { id, episodes, racine };
}

/** La mémoire donnée à l'IA pour écrire l'épisode suivant. */
export function memoire(serie: Serie, choix: string): MemoireSerie {
  const dernier = serie.episodes[serie.episodes.length - 1]?.story ?? serie.racine;
  // Distribution : celle de la série, enrichie des personnages apparus ensuite.
  const cast = new Map<string, { nom: string; visuel: string }>();
  for (const e of serie.episodes) for (const c of e.story.cast ?? []) if (!cast.has(c.nom.toLowerCase())) cast.set(c.nom.toLowerCase(), c);
  return {
    numero: (serie.episodes[serie.episodes.length - 1]?.numero ?? 1) + 1,
    personnages: dernier.personnages ?? serie.racine.personnages,
    cast: [...cast.values()].slice(0, 6),
    // Les 3 derniers résumés (bible : la mémoire reçoit les trois derniers épisodes).
    resumes: serie.episodes.slice(-3).map((e) => e.story.resume ?? e.story.pages.map((p) => p.texte).join(" ").slice(0, 400)),
    fils: dernier.fils ?? dernier.plan?.accroche_suite,
    // La ritournelle de la série est celle du premier épisode ; les faits s'accumulent.
    ritournelle: serie.racine.plan?.ritournelle,
    faits: serie.episodes.map((e) => e.story.faits).filter(Boolean).join(" ").slice(-700) || undefined,
    choix,
  };
}
