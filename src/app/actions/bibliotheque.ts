"use server";

/** Administration de la bibliothèque d'écriture (RAG) : réservée aux administrateurs. */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { findThemeById } from "@/lib/themes";
import { ajouterExemple, basculerExemple, supprimerExemple } from "@/lib/bibliotheque";

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
