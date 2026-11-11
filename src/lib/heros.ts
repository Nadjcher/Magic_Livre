/**
 * Le héros de l'enfant : dessiné UNE fois d'après sa photo, dans le style de
 * ses livres, validé par le parent (« Est-ce bien votre enfant ? »), puis
 * réutilisé dans tous ses livres. Le parent juge la ressemblance au bon moment,
 * et on ne paie les pages que pour un héros accepté.
 *
 * Confidentialité : la photo sert seulement à dessiner le portrait (fal.ai) et
 * n'est jamais conservée. On garde le portrait DESSINÉ et la liste des traits.
 */

import "server-only";
import { prisma } from "./prisma";
import { env } from "./env";
import { requestPortrait, faceIdentityEnabled } from "./faceIdentity";
import { generateIllustration } from "./illustration";
import { ILLUSTRATION_STYLES, type IllustrationStyle } from "./style_config";
import { noterDepense, PRIX_ESTIMES } from "./budget";
import { fetchAsDataUrl } from "./imageFetch";

type Ref = { base64: string; mime: string };

export interface Heros {
  id: string;
  userId: string;
  childId: string | null;
  style: string;
  portrait: string; // image stockée (blob privé ou URL)
  traits: string;
  valide: boolean;
  essais: number;
}

let tablePrete: Promise<void> | null = null;
function assurerTable(): Promise<void> {
  tablePrete ??= prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "Heros" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "childId" TEXT REFERENCES "Child"(id) ON DELETE CASCADE,
        style TEXT NOT NULL,
        portrait TEXT NOT NULL,
        traits TEXT NOT NULL DEFAULT '',
        valide BOOLEAN NOT NULL DEFAULT FALSE,
        essais INT NOT NULL DEFAULT 1,
        "creeLe" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )
    .then(() => undefined)
    .catch((e) => {
      tablePrete = null;
      throw e;
    });
  return tablePrete;
}

/**
 * Les traits visibles d'après la photo, en français, pour que le parent les
 * confirme : yeux, sourire, cheveux (couleur exacte), teint, signes
 * particuliers. Signale une lumière trompeuse (coucher de soleil, filtre).
 */
export async function traitsDepuisPhoto(photo: Ref): Promise<{ traits: string; lumiere: "ok" | "chaude" }> {
  try {
    const r = await fetch("https://fal.run/openrouter/router/vision", {
      method: "POST",
      headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        image_urls: [`data:${photo.mime};base64,${photo.base64}`],
        prompt:
          "Décris, pour un illustrateur, l'apparence visible du personnage de référence sur cette image, en français, sans jamais l'identifier ni le nommer. " +
          'Réponds UNIQUEMENT en JSON : {"cheveux": "couleur exacte et coiffure", "yeux": "couleur et forme (ex. petits, plissés quand il sourit)", "sourire": "forme", "teint": "…", "signes": "taches de rousseur, lunettes, fossettes… ou rien", "lumiere": "ok | chaude"} ' +
          '("lumiere" = "chaude" si la photo est prise au coucher du soleil, en lumière dorée ou avec un filtre qui change les couleurs).',
        max_tokens: 400,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(40_000),
    });
    const j = (await r.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
    if (r.ok) await noterDepense(j.usage?.cost ?? PRIX_ESTIMES.vision);
    const v = JSON.parse(/\{[\s\S]*\}/.exec(j.output ?? "")?.[0] ?? "{}") as Record<string, string>;
    const morceaux = [
      v.cheveux && `cheveux ${v.cheveux}`,
      v.yeux && `yeux ${v.yeux}`,
      v.sourire && `sourire ${v.sourire}`,
      v.teint && `teint ${v.teint}`,
      v.signes && !/^rien|aucun/i.test(v.signes) && v.signes,
    ].filter(Boolean);
    return { traits: morceaux.join(", ").slice(0, 240), lumiere: v.lumiere === "chaude" ? "chaude" : "ok" };
  } catch {
    return { traits: "", lumiere: "ok" };
  }
}

/**
 * Dessine le portrait du héros dans le style du livre : visage fidèle (modèle
 * de ressemblance quand il répond, sinon la photo en référence), traits imposés.
 */
export async function dessinerPortrait(
  photo: Ref,
  traits: string,
  style: IllustrationStyle,
): Promise<{ imageUrl: string; ref: Ref } | { erreur: string }> {
  // 1. Ressemblance (PuLID) ; s'il tarde (démarrage à froid), on part de la photo.
  let identite: Ref | undefined;
  if (faceIdentityEnabled()) {
    const p = await requestPortrait({
      referenceImageUrl: `data:${photo.mime};base64,${photo.base64}`,
      stylePrompt: ILLUSTRATION_STYLES[style].prompt,
      appearance: traits,
    });
    if (p.image) identite = p.image;
  }
  // 2. Le portrait dans le style des pages du livre (même technique, même palette).
  const r = await generateIllustration({
    style,
    scene:
      "Head-and-shoulders portrait of the hero, facing the viewer with a natural smile, painted exactly like the pages of this book " +
      `(same technique, same palette, same light), soft painted background from the book's world, not a white background. Keep these exact traits: ${traits}.`,
    appearance: traits,
    referenceImage: identite ?? photo,
    seed: Date.now() % 1_000_000,
  });
  if (!r.imageUrl || !r.base64) {
    return { erreur: /content_policy|flagged|checker/i.test(r.error ?? "") ? "filtre" : "indisponible" };
  }
  return { imageUrl: r.imageUrl, ref: { base64: r.base64, mime: r.mime ?? "image/jpeg" } };
}

export async function enregistrerHeros(h: Omit<Heros, "id" | "valide" | "essais"> & { essais?: number }): Promise<string> {
  await assurerTable();
  const id = `h_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await prisma.$executeRaw`
    INSERT INTO "Heros" (id, "userId", "childId", style, portrait, traits, essais)
    VALUES (${id}, ${h.userId}, ${h.childId}, ${h.style}, ${h.portrait}, ${h.traits}, ${h.essais ?? 1})`;
  return id;
}

export async function lireHeros(id: string, userId: string): Promise<Heros | null> {
  await assurerTable();
  const [h] = await prisma.$queryRaw<Heros[]>`SELECT * FROM "Heros" WHERE id = ${id} AND "userId" = ${userId}`;
  return h ?? null;
}

/** Lecture interne (pipeline), sans contrôle de propriétaire. */
export async function lireHerosParId(id: string): Promise<Heros | null> {
  await assurerTable();
  const [h] = await prisma.$queryRaw<Heros[]>`SELECT * FROM "Heros" WHERE id = ${id}`;
  return h ?? null;
}

/** Le héros validé d'un enfant pour un style, s'il existe. */
export async function herosValide(childId: string, style: string): Promise<Heros | null> {
  try {
    await assurerTable();
    const [h] = await prisma.$queryRaw<Heros[]>`
      SELECT * FROM "Heros" WHERE "childId" = ${childId} AND style = ${style} AND valide ORDER BY "creeLe" DESC LIMIT 1`;
    return h ?? null;
  } catch {
    return null;
  }
}

/** Le parent a dit « Oui, c'est mon enfant » (et a pu corriger les traits). */
export async function validerHeros(id: string, userId: string, childId: string, traits: string): Promise<void> {
  await assurerTable();
  await prisma.$executeRaw`
    UPDATE "Heros" SET valide = TRUE, "childId" = ${childId}, traits = ${traits.slice(0, 240)} WHERE id = ${id} AND "userId" = ${userId}`;
}

/** L'image du héros validé, prête à servir d'ancre pour les pages. */
export async function refHeros(h: Heros): Promise<Ref | null> {
  const d = await fetchAsDataUrl(h.portrait, { maxPx: 1024, quality: 88 });
  const m = d ? /^data:([^;]+);base64,(.+)$/.exec(d) : null;
  return m ? { mime: m[1] as string, base64: m[2] as string } : null;
}

/** Portraits demandés par ce compte aujourd'hui (garde-fou : 4 par jour). */
export async function portraitsDuJour(userId: string): Promise<number> {
  try {
    await assurerTable();
    const [r] = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COALESCE(SUM(essais), 0)::bigint AS n FROM "Heros" WHERE "userId" = ${userId} AND "creeLe" > NOW() - INTERVAL '1 day'`;
    return Number(r?.n ?? 0);
  } catch {
    return 0;
  }
}
