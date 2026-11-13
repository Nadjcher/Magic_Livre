"use server";

/** Administration de la bibliothèque d'écriture (RAG) : réservée aux administrateurs. */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { findThemeById } from "@/lib/themes";
import { ajouterExemple, basculerExemple, supprimerExemple } from "@/lib/bibliotheque";
import { waitUntil } from "@vercel/functions";
import { EN_RELECTURE, EN_RELECTURE_IMAGES } from "@/lib/illustrationStatus";
import { peutDebloquer } from "@/lib/apercu";
import { lireFiche } from "@/lib/ficheEnfant";
import { memoire, serieDe } from "@/lib/serie";
import { secondeGeneration } from "@/lib/livraison";
import { lancerIllustrations } from "@/lib/bookPipeline";
import type { StoryRequest } from "@/lib/storyPrompt";
import type { IllustrationStyle } from "@/lib/style_config";

const TONS = ["tendre", "drole", "feerique", "aventure", "mystere", "comptine"];

async function admin(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && estAdmin(user.email));
}

function tonsDe(formData: FormData): string[] {
  return formData.getAll("tons").map(String).filter((t) => TONS.includes(t));
}

/** Ajoute un extrait ou une trame écrit à la main. */
export async function ajouterExempleAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const texte = String(formData.get("texte") ?? "").trim().slice(0, 4000);
  const titre = String(formData.get("titre") ?? "").trim().slice(0, 120);
  if (texte.length < 40 || !titre) return;
  const ageMin = Math.min(12, Math.max(1, Number(formData.get("ageMin") ?? 3)));
  const ageMax = Math.min(12, Math.max(ageMin, Number(formData.get("ageMax") ?? 8)));
  await ajouterExemple({
    type: formData.get("type") === "trame" ? "trame" : "extrait",
    titre,
    ageMin,
    ageMax,
    tons: tonsDe(formData),
    formats: [],
    themes: [],
    texte,
    source: "main",
  });
  revalidatePath("/admin/histoires");
}

/** Une histoire réussie (d'un compte administrateur) entre dans la bibliothèque. */
export async function validerHistoireAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) return;
  const bookId = String(formData.get("bookId") ?? "");
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id, deletedAt: null },
    select: { title: true, pages: true, child: { select: { age: true, firstName: true } } },
  });
  const parsed = storySchema.safeParse(book?.pages);
  if (!book || !parsed.success) return;
  const story = parsed.data;
  const de = Math.max(1, Number(formData.get("de") ?? 1));
  const a = Math.min(story.pages.length, Math.max(de, Number(formData.get("a") ?? 4)));
  // Le prénom de l'enfant ne doit pas servir de modèle : remplacé par un prénom neutre.
  const prenom = book.child.firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const texte = story.pages
    .slice(de - 1, a)
    .map((p) => p.texte.trim())
    .join("\n\n")
    .replace(new RegExp(`(^|[^\\p{L}])${prenom}(?=[^\\p{L}]|$)`, "gu"), "$1Nino");
  const age = story.meta?.age ?? book.child.age;
  const theme = findThemeById(story.meta?.themeId);
  await ajouterExemple({
    type: "extrait",
    titre: book.title.replace(/\s+(de|d['’])\s*\S+$/u, ""),
    ageMin: Math.max(1, age - 1),
    ageMax: Math.min(12, age + 1),
    tons: tonsDe(formData),
    formats: story.meta?.format ? [story.meta.format] : [],
    themes: theme ? [theme.id, theme.categorie] : [],
    texte,
    source: "validee",
  });
  revalidatePath("/admin/histoires");
}

export async function basculerExempleAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  await basculerExemple(String(formData.get("id") ?? ""));
  revalidatePath("/admin/histoires");
}

export async function supprimerExempleAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  await supprimerExemple(String(formData.get("id") ?? ""));
  revalidatePath("/admin/histoires");
}

/* ─── Histoires en relecture humaine (motif éliminatoire après deux générations) ─── */

async function requeteDepuisLivre(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { userId: true, tier: true, pages: true, errorMessage: true, childId: true, child: { select: { firstName: true, age: true } } },
  });
  const st = storySchema.safeParse(book?.pages);
  if (!book || !st.success || book.errorMessage !== EN_RELECTURE) return null;
  const story = st.data;
  const req: StoryRequest = {
    childFirstName: book.child.firstName,
    childAge: book.child.age,
    mode: story.meta?.mode === "libre" || story.serie ? "libre" : "theme",
    themeId: story.meta?.themeId,
    prompt: story.meta?.prompt,
    longueur: "moyenne",
    style: (story.style ?? "feerique") as IllustrationStyle,
    format: story.meta?.format,
    premium: book.tier === "premium",
    apercu: !(await peutDebloquer(book.userId, bookId)),
    childId: book.childId,
    fiche: await lireFiche(book.childId),
  };
  if (story.serie) {
    const serie = await serieDe(book.userId, story.serie.id);
    if (serie) {
      // La mémoire ne doit pas contenir l'épisode refusé lui-même.
      const sansCelui = { ...serie, episodes: serie.episodes.filter((e) => e.id !== bookId && e.numero < story.serie!.numero) };
      req.serie = { ...memoire(sansCelui, story.meta?.prompt ?? "la suite de l'aventure"), numero: story.serie.numero };
    }
  }
  return { req, story };
}

/** Relance une génération complète (le résultat repasse par la relecture). */
export async function relancerHistoireAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const bookId = String(formData.get("bookId") ?? "");
  const r = await requeteDepuisLivre(bookId);
  if (!r) return;
  await prisma.book.update({ where: { id: bookId }, data: { status: "generating", errorMessage: null } });
  const complement = r.story.serie ? { serie: r.story.serie, style: r.story.style, fiches: r.story.fiches } : undefined;
  waitUntil(secondeGeneration({ bookId, req: r.req, portrait: null, complement, tentative: 2 }));
  revalidatePath("/admin/histoires");
}

/** Vous avez relu la version actuelle et la jugez bonne : elle est illustrée et livrée. */
export async function livrerVersionAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const bookId = String(formData.get("bookId") ?? "");
  const r = await requeteDepuisLivre(bookId);
  if (!r) return;
  const pages = { ...r.story, qualite: r.story.qualite ? { ...r.story.qualite, aRevoir: false } : undefined };
  await prisma.book.update({ where: { id: bookId }, data: { status: "generating", errorMessage: null, pages } });
  waitUntil(lancerIllustrations({ bookId, req: r.req, portrait: null }));
  revalidatePath("/admin/histoires");
}

/** Illustrations en relecture : vous avez regardé les pages signalées, le livre est livré tel quel. */
export async function livrerIllustrationsAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const bookId = String(formData.get("bookId") ?? "");
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true, errorMessage: true } });
  const st = storySchema.safeParse(book?.pages);
  if (!book || !st.success || book.errorMessage !== EN_RELECTURE_IMAGES) return;
  const pages = { ...st.data, imagesARevoir: undefined };
  await prisma.book.update({ where: { id: bookId }, data: { status: "ready", errorMessage: null, pages } });
  const { notifierLivrePret } = await import("@/lib/notifications");
  await notifierLivrePret(bookId).catch(() => undefined);
  revalidatePath("/admin/histoires");
}

/** Crédit fal rechargé : les livres en file d'attente repartent (chacun dans sa propre exécution). */
export async function relancerAttenteAction(): Promise<void> {
  if (!(await admin())) return;
  const { relancerEnAttente } = await import("@/lib/attenteIllustrations");
  waitUntil(relancerEnAttente(20).catch(() => 0));
  revalidatePath("/admin/histoires");
}
