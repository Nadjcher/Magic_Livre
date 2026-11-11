/**
 * RAG d'écriture : la bibliothèque de textes modèles.
 *
 * À chaque histoire, on cherche dans la bibliothèque les 2 extraits et la
 * trame les plus proches de la demande (âge, type de livre, thème, ton) et
 * on les donne à l'IA comme modèles de TON et de STRUCTURE (jamais à copier).
 * La bibliothèque grandit avec les histoires que l'administrateur valide.
 *
 * Table créée et remplie au premier usage (bibliothèque de départ).
 */

import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { BIBLIOTHEQUE_DEPART, type Ton, type TypeExemple } from "./bibliothequeDepart";
import { findThemeById } from "./themes";

export interface Exemple {
  id: string;
  type: TypeExemple;
  titre: string;
  ageMin: number;
  ageMax: number;
  tons: string[];
  formats: string[];
  themes: string[];
  texte: string;
  source: "depart" | "validee" | "main";
  actif: boolean;
  utilisations: number;
}

let tablePrete: Promise<void> | null = null;
function assurerTable(): Promise<void> {
  tablePrete ??= (async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Exemple" (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      titre TEXT NOT NULL,
      "ageMin" INT NOT NULL,
      "ageMax" INT NOT NULL,
      tons TEXT[] NOT NULL DEFAULT '{}',
      formats TEXT[] NOT NULL DEFAULT '{}',
      themes TEXT[] NOT NULL DEFAULT '{}',
      texte TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'main',
      actif BOOLEAN NOT NULL DEFAULT TRUE,
      utilisations INT NOT NULL DEFAULT 0,
      "creeLe" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    // Bibliothèque de départ : ajoutée une fois (un exemple désactivé par l'admin le reste).
    for (const e of BIBLIOTHEQUE_DEPART) {
      await prisma.$executeRaw`
        INSERT INTO "Exemple" (id, type, titre, "ageMin", "ageMax", tons, formats, themes, texte, source)
        VALUES (${`depart:${e.cle}`}, ${e.type}, ${e.titre}, ${e.ageMin}, ${e.ageMax}, ${e.tons}, ${e.formats}, ${e.themes}, ${e.texte}, 'depart')
        ON CONFLICT (id) DO NOTHING`;
    }
  })().catch((e) => {
    tablePrete = null;
    throw e;
  });
  return tablePrete;
}

/** Tons associés à une catégorie de thème. */
const TONS_CATEGORIE: Record<string, Ton[]> = {
  fetes: ["feerique", "tendre"],
  grandir: ["tendre", "drole"],
  emotions: ["tendre"],
  aventures: ["aventure", "feerique"],
  passions: ["drole", "aventure"],
  classiques: ["feerique", "aventure"],
};

/**
 * Les modèles pour une demande : 2 extraits (ton) + 1 trame (structure),
 * choisis parmi les plus proches, avec un peu de hasard pour varier.
 */
export async function exemplesPour(demande: {
  age: number;
  format?: string;
  themeId?: string;
  /** Rotation : un extrait servi à cet enfant n'est pas resservi dans ses 5 histoires suivantes. */
  childId?: string;
}): Promise<{ extraits: Exemple[]; trame: Exemple | null }> {
  try {
    await assurerTable();
    const deja = new Set<string>();
    if (demande.childId) {
      const recents = await prisma.book.findMany({
        where: { childId: demande.childId, pages: { not: Prisma.DbNull } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { pages: true },
      });
      for (const r of recents) {
        const ids = (r.pages as { meta?: { modeles?: unknown } } | null)?.meta?.modeles;
        if (Array.isArray(ids)) ids.forEach((id) => deja.add(String(id)));
      }
    }
    const candidats = await prisma.$queryRaw<Exemple[]>`
      SELECT * FROM "Exemple" WHERE actif AND "ageMin" - 1 <= ${demande.age} AND "ageMax" + 1 >= ${demande.age}`;
    // Les extraits déjà lus par l'enfant passent en dernier (les trames peuvent revenir).
    const frais = candidats.filter((e) => e.type === "trame" || !deja.has(e.id));
    const tous = frais.filter((e) => e.type === "extrait").length >= 2 ? frais : candidats;
    const theme = findThemeById(demande.themeId);
    const tonsVoulus = new Set<string>(theme ? TONS_CATEGORIE[theme.categorie] ?? [] : ["drole", "aventure"]);
    const score = (e: Exemple) =>
      (e.ageMin <= demande.age && e.ageMax >= demande.age ? 3 : 0) +
      (demande.format && e.formats.includes(demande.format) ? 3 : e.formats.length === 0 ? 1 : 0) +
      (theme && e.themes.includes(theme.id) ? 3 : theme && e.themes.includes(theme.categorie) ? 2 : 0) +
      (e.tons.some((t) => tonsVoulus.has(t)) ? 1 : 0) +
      (e.source === "validee" ? 1 : 0) +
      Math.random() * 1.5; // variété
    const tri = (type: TypeExemple) =>
      tous.filter((e) => e.type === type).map((e) => ({ e, s: score(e) })).sort((a, b) => b.s - a.s).map((x) => x.e);
    const extraits = tri("extrait").slice(0, 2);
    const trame = tri("trame")[0] ?? null;
    const ids = [...extraits, ...(trame ? [trame] : [])].map((e) => e.id);
    if (ids.length) {
      await prisma.$executeRaw`UPDATE "Exemple" SET utilisations = utilisations + 1 WHERE id = ANY(${ids})`.catch(() => 0);
    }
    return { extraits, trame };
  } catch (e) {
    console.error("[bibliothèque]", String(e).slice(0, 160));
    return { extraits: [], trame: null }; // jamais bloquant
  }
}

/** Bloc de consignes à ajouter à la demande d'écriture. */
export function blocModeles({ extraits, trame }: { extraits: Exemple[]; trame: Exemple | null }): string {
  if (!extraits.length && !trame) return "";
  const lignes = [
    "MODÈLES DE TON (extraits d'albums de notre maison d'édition). Inspire-toi de leur VOIX : rythme, phrases courtes et concrètes, humour, dialogues. NE COPIE NI leurs phrases, NI leurs personnages, NI leurs idées : ton histoire est entièrement nouvelle.",
  ];
  extraits.forEach((e, i) => lignes.push(`--- Modèle ${i + 1} : « ${e.titre} » ---\n${e.texte}`));
  if (trame) lignes.push(`STRUCTURE CONSEILLÉE (adapte-la librement au thème) — ${trame.titre} : ${trame.texte}`);
  return lignes.join("\n\n");
}

/** Les exemples donnés à l'autrice (pour que la relectrice puisse repérer une copie). */
export async function exemplesParIds(ids: string[]): Promise<Exemple[]> {
  try {
    await assurerTable();
    return await prisma.$queryRaw<Exemple[]>`SELECT * FROM "Exemple" WHERE id = ANY(${ids})`;
  } catch {
    return [];
  }
}

/* ─── Administration ─── */

export async function listerExemples(): Promise<Exemple[]> {
  await assurerTable();
  return prisma.$queryRaw<Exemple[]>`SELECT * FROM "Exemple" ORDER BY type, "ageMin", titre`;
}

export async function ajouterExemple(e: Omit<Exemple, "id" | "actif" | "utilisations">): Promise<void> {
  await assurerTable();
  const id = `${e.source}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await prisma.$executeRaw`
    INSERT INTO "Exemple" (id, type, titre, "ageMin", "ageMax", tons, formats, themes, texte, source)
    VALUES (${id}, ${e.type}, ${e.titre}, ${e.ageMin}, ${e.ageMax}, ${e.tons}, ${e.formats}, ${e.themes}, ${e.texte}, ${e.source})`;
}

export async function basculerExemple(id: string): Promise<void> {
  await assurerTable();
  await prisma.$executeRaw`UPDATE "Exemple" SET actif = NOT actif WHERE id = ${id}`;
}

/** Supprime un exemple (ceux de départ sont seulement désactivés : ils reviendraient sinon). */
export async function supprimerExemple(id: string): Promise<void> {
  await assurerTable();
  if (id.startsWith("depart:")) await prisma.$executeRaw`UPDATE "Exemple" SET actif = FALSE WHERE id = ${id}`;
  else await prisma.$executeRaw`DELETE FROM "Exemple" WHERE id = ${id}`;
}
