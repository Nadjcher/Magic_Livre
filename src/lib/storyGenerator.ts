/**
 * Génération de l'histoire via l'API Anthropic (Claude).
 *
 * Appelée UNIQUEMENT côté serveur. La clé API et le prompt système ne sont
 * jamais renvoyés au client. En cas d'échec de format, on réessaie une fois,
 * puis on renvoie une erreur claire en français.
 */

import "server-only";
import OpenAI from "openai";
import { env } from "./env";
import {
  SYSTEM_PROMPT,
  buildUserMessage,
  ageGuidance,
  type StoryRequest,
} from "./storyPrompt";
import { parseStory, type Story } from "./storySchema";
import { filterStory } from "./contentFilter";
import { findProtectedNames } from "./protectedCharacters";
import { generateIllustration, illustrationsEnabled } from "./illustration";
import { faceIdentityEnabled, generateCharacterPortrait } from "./faceIdentity";
import { ILLUSTRATION_STYLES } from "./style_config";
import { findFormat } from "./bookFormats";
import { fetchAsDataUrl } from "./imageFetch";
import { controleActif, controlerIllustrations } from "./controleIllustrations";

export type GenerateResult =
  | {
      ok: true;
      story: Story;
      /** Diagnostic si des illustrations manquent. */
      imageReport?: string;
      /** Portrait ressemblant (fal) déjà calculé, pour l'étape d'illustration. */
      portrait?: { base64: string; mime: string } | null;
    }
  | { ok: false; message: string };

/** Vrai si le texte des pages est majoritairement en anglais (au lieu du français). */
export function texteEnAnglais(story: Story): boolean {
  const mots = [story.titre, ...story.pages.map((p) => p.texte)].join(" ").toLowerCase().match(/[a-zàâçéèêëîïôûùüÿœ']+/g) ?? [];
  const en = new Set(["the", "and", "is", "with", "his", "her", "to", "of", "you", "they", "are", "was", "he", "she", "it", "for", "away", "back"]);
  const fr = new Set(["le", "la", "les", "et", "est", "un", "une", "des", "il", "elle", "dans", "avec", "de", "du", "sur", "son", "sa"]);
  let nEn = 0;
  let nFr = 0;
  for (const m of mots) {
    if (en.has(m)) nEn++;
    if (fr.has(m)) nFr++;
  }
  return nEn > nFr;
}

/** Exécute `fn` sur chaque élément avec au plus `limit` appels simultanés. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i] as T, i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Résume les échecs d'illustration (« 3/13 images manquantes : HTTP 429 … »). */
export function imageReportOf(story: Story, errors: string[]): string | undefined {
  const total = story.pages.length + 1;
  const manquantes =
    (story.couvertureUrl ? 0 : 1) + story.pages.filter((p) => !p.imageUrl).length;
  if (manquantes === 0) return undefined;
  const raisons = Array.from(new Set(errors.filter(Boolean))).slice(0, 2).join(" | ");
  return `Illustrations manquantes : ${manquantes}/${total}. ${raisons}`.slice(0, 480);
}

/**
 * Client Groq (API compatible OpenAI) créé paresseusement pour ne lire la clé
 * qu'au moment de l'appel.
 */
function createClient(): OpenAI {
  return new OpenAI({
    apiKey: env.groqApiKey(),
    baseURL: "https://api.groq.com/openai/v1",
  });
}

/**
 * Appelle le modèle une fois et renvoie le texte brut de la réponse (JSON).
 */
async function callModel(
  client: OpenAI,
  model: string,
  system: string,
  userMessage: string,
  temperature = 0.9,
  premium = false,
  info?: { viaFal?: boolean },
): Promise<string> {
  // Écriture par un grand modèle (Claude via fal) : bien meilleur en français
  // et en cohérence. Repli automatique sur Groq en cas d'échec.
  if (env.falApiKey() && process.env.STORY_LLM !== "groq") {
    const modele = premium
      ? process.env.STORY_MODEL_PREMIUM || "anthropic/claude-opus-5.5"
      : process.env.STORY_MODEL || "anthropic/claude-opus-5.5";
    try {
      const r = await fetch("https://fal.run/openrouter/router", {
        method: "POST",
        headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modele,
          system_prompt: system,
          prompt: `${userMessage}\n\nRéponds UNIQUEMENT avec l'objet JSON demandé, sans texte autour.`,
          // (pas de « temperature » : imposée par le mode réflexion)
          // Les modèles Claude récents réfléchissent avant d'écrire (obligatoire
          // sur ce point d'accès) : marge de jetons pour la réflexion + le JSON.
          reasoning: true,
          max_tokens: 16000,
        }),
        // Écriture ≤ 100 s, relecture ≤ 70 s : le tout reste sous la limite de 5 min.
        signal: AbortSignal.timeout(temperature < 0.6 ? 70_000 : 150_000),
      });
      const j = (await r.json()) as { output?: string; error?: unknown };
      if (r.ok && j.output && j.output.includes("{")) {
        if (info) info.viaFal = true;
        console.log("[texte] écrit par", modele);
        return j.output.trim();
      }
      console.error("[texte] fal/openrouter :", r.status, JSON.stringify(j.error ?? j).slice(0, 200));
    } catch (e) {
      console.error("[texte] fal/openrouter :", String(e).slice(0, 200));
    }
  }

  const response = await client.chat.completions.create(
    {
      model,
      max_tokens: 6000,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    },
    { timeout: 90_000 },
  );

  return response.choices[0]?.message?.content?.trim() ?? "";
}

/** Prompt « éditeur » : réécrit une histoire pour la clarifier et l'adapter à l'âge. */
const EDITOR_SYSTEM = `Tu es un éditeur jeunesse exigeant. On te donne une histoire au format JSON. Tu la RÉÉCRIS pour l'améliorer, SANS changer la structure JSON ni le nombre de pages.
CONTRÔLE DE COHÉRENCE (prioritaire) — corrige tout manquement :
- Chaque personnage est PRÉSENTÉ (qui il est, à quoi il ressemble) la première fois qu'il apparaît ; aucun personnage ne surgit sans explication, aucun n'est nommé sans avoir été présenté.
- Un personnage garde le même nom, la même espèce et la même apparence du début à la fin (texte, scene_illustration ET fiche "personnages" doivent concorder).
- Chaque page découle logiquement de la précédente ; le problème posé au début est résolu à la fin par une action du héros qui a du sens ; pas d'élément magique nouveau et gratuit dans le dernier tiers.
- Chaque "scene_illustration" nomme les personnages présents et rappelle leurs traits clés (espèce, couleurs, tenue du héros).
Objectifs : clarté absolue (le parent et l'enfant comprennent tout de suite), émotion sincère, fluidité, et surtout un respect PARFAIT de l'âge indiqué (longueur de phrase et vocabulaire).
Garde le même héros, le même fil, les mêmes scènes. Améliore le texte de chaque page et le titre si besoin. Conserve "scene_illustration" en anglais, détaillé, cohérent.
IMPÉRATIF : supprime toute répétition mécanique (par ex. la même phrase recollée à la fin de chaque page) — chaque page doit avoir un texte différent. Corrige toute tournure maladroite ou agrammaticale (ex. « avance avec le sourire » → « avance en souriant »).
Réponds UNIQUEMENT avec le même JSON strict : { "titre": string, "personnages": string, "pages": [ { "texte": string, "scene_illustration": string } ] } ("personnages" : la fiche visuelle en anglais, corrigée si besoin, qui commence par la tenue du héros).`;

/**
 * Passe de révision : demande au modèle de réécrire l'histoire validée pour
 * gagner en clarté et en adéquation à l'âge. Renvoie une histoire valide et
 * filtrée, ou null si la réécriture échoue (on garde alors l'originale).
 */
async function polishStory(
  client: OpenAI,
  model: string,
  story: Story,
  req: StoryRequest,
): Promise<Story | null> {
  const message = [
    `Âge de l'enfant : ${req.childAge} ans.`,
    "Consignes d'âge à respecter STRICTEMENT :",
    ageGuidance(req.childAge),
    "",
    "Histoire à réécrire (améliore le texte, garde la structure) :",
    JSON.stringify({ titre: story.titre, personnages: story.personnages, pages: story.pages.map((p) => ({ texte: p.texte, scene_illustration: p.scene_illustration })) }),
  ].join("\n");

  let raw: string;
  try {
    // Température basse à la relecture (fidélité + correction).
    // Relecture : Sonnet suffit (et garde le temps total sous la limite).
    raw = await callModel(client, model, EDITOR_SYSTEM, message, 0.4, false);
  } catch {
    return null;
  }

  const parsed = parseStory(raw);
  if (!parsed.ok) return null;
  if (texteEnAnglais(parsed.story)) return null;
  const filtered = filterStory(parsed.story);
  if (!filtered.ok) return null;

  const fullText = [
    parsed.story.titre,
    ...parsed.story.pages.map((p) => `${p.texte} ${p.scene_illustration}`),
  ].join(" ");
  if (findProtectedNames(fullText).length > 0) return null;

  // Fiche personnages : celle corrigée par l'éditeur, sinon l'originale ; la
  // distribution et les personnages présents par page sont conservés.
  return {
    ...parsed.story,
    personnages: parsed.story.personnages || story.personnages,
    cast: parsed.story.cast ?? story.cast,
    pages: parsed.story.pages.map((p, i) => ({ ...p, presents: p.presents ?? story.pages[i]?.presents })),
  };
}

/**
 * Génère une histoire validée et filtrée. Réessaie une fois en cas de format
 * invalide. Applique le filtre de contenu et le refus des personnages protégés
 * sur la sortie avant de renvoyer le résultat.
 */
export async function generateStory(
  req: StoryRequest,
  { illustrer = true }: { illustrer?: boolean } = {},
): Promise<GenerateResult> {
  let userMessage = buildUserMessage(req);
  const client = createClient();
  // Édition premium : modèle de texte haut de gamme (configurable).
  const model = req.premium ? env.groqModelPremium() : env.groqModel();

  // Le portrait « vraie ressemblance » (fal) ne dépend que de la photo : on le
  // lance tout de suite, EN PARALLÈLE de l'écriture du texte, pour que ses
  // 20–50 s ne s'ajoutent pas au temps total de génération.
  const style = req.style ?? "feerique";
  const portraitPromise: Promise<{ base64: string; mime: string } | null> =
    illustrationsEnabled() && faceIdentityEnabled() && req.photo
      ? generateCharacterPortrait({
          photo: req.photo,
          stylePrompt: ILLUSTRATION_STYLES[style].prompt,
          appearance: req.appearance,
        })
      : Promise.resolve(null);

  let lastMessage = "La génération de l'histoire a échoué. Veuillez réessayer.";
  // Fournisseur effectivement utilisé (Claude via fal, ou repli Groq).
  const info: { viaFal?: boolean } = {};

  // Deux tentatives : la première, puis une seconde en cas de format invalide.
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: string;
    try {
      // Température élevée à l'écriture (créativité).
      raw = await callModel(client, model, SYSTEM_PROMPT, userMessage, 0.9, req.premium, info);
    } catch {
      lastMessage =
        "Le service de génération est momentanément indisponible. Réessayez dans quelques instants.";
      // Erreur réseau/API : inutile de réessayer immédiatement.
      break;
    }

    const parsed = parseStory(raw);
    if (!parsed.ok) {
      lastMessage =
        "L'histoire générée n'était pas au bon format. Veuillez réessayer.";
      continue; // réessaie une fois
    }

    // Le livre doit être en français (le modèle de repli répond parfois en anglais).
    if (texteEnAnglais(parsed.story)) {
      lastMessage = "L'histoire n'a pas été écrite en français. Veuillez réessayer.";
      userMessage += "\n\nIMPORTANT : la tentative précédente était en anglais. Écris le titre et le texte de TOUTES les pages EN FRANÇAIS.";
      continue;
    }

    // Filtre de contenu sur la sortie.
    const filtered = filterStory(parsed.story);
    if (!filtered.ok) {
      lastMessage =
        "L'histoire générée contenait un passage inadapté. Veuillez réessayer avec une autre idée.";
      continue;
    }

    // Vérification des personnages protégés sur l'ensemble du texte.
    const fullText = [
      parsed.story.titre,
      ...parsed.story.pages.map((p) => `${p.texte} ${p.scene_illustration}`),
    ].join(" ");
    if (findProtectedNames(fullText).length > 0) {
      lastMessage =
        "L'histoire générée mentionnait un personnage protégé. Veuillez réessayer.";
      continue;
    }

    // Passe de révision éditoriale (clarté + adéquation à l'âge). En cas
    // d'échec de la réécriture, on conserve l'histoire d'origine.
    // Claude (plan + réflexion) écrit déjà une histoire cohérente : la relecture
    // n'est utile qu'avec le modèle de repli (et économise du temps).
    const polished = info.viaFal ? null : await polishStory(client, model, parsed.story, req);
    const base = polished ?? parsed.story;

    // Étape « texte seul » : les illustrations seront faites par une seconde
    // exécution (son propre budget de temps), cf. illustrateStory.
    if (!illustrer) return { ok: true, story: { ...base, style }, portrait: await portraitPromise };

    // Texte validé : on ajoute les illustrations si la génération est activée.
    const errors: string[] = [];
    const story = await addIllustrations(base, req, await portraitPromise, errors);
    return { ok: true, story, imageReport: imageReportOf(story, errors) };
  }

  return { ok: false, message: lastMessage };
}

/** Petit hachage stable pour dériver une graine d'image reproductible. */
function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 1_000_000;
}

/** Retrouve les fiches des personnages présents sur une page (par nom). */
function fichesPresentes(
  page: Story["pages"][number],
  fiches: Map<string, { base64: string; mime: string }>,
): { name: string; base64: string; mime: string }[] {
  const noms = new Set<string>();
  const texte = `${page.texte} ${page.scene_illustration}`.toLowerCase();
  for (const nom of fiches.keys()) {
    const declare = page.presents?.some((p) => p.toLowerCase() === nom.toLowerCase());
    // Repli si "presents" manque : le nom apparaît dans la scène dessinée.
    if (declare || (!page.presents && texte.includes(nom.toLowerCase()))) noms.add(nom);
  }
  return [...noms].slice(0, 3).map((name) => ({ name, ...fiches.get(name)! }));
}

/**
 * Illustre le livre comme un studio d'animation :
 *  1. FICHES DE RÉFÉRENCE : le héros en pied (visage d'après la photo, tenue
 *     fixe) et chaque personnage secondaire récurrent, dessinés une fois ;
 *  2. couverture et pages, en parallèle, chacune avec les fiches des
 *     personnages présents — personne ne change d'apparence ni d'espèce.
 * En cas d'échec, l'URL reste nulle : le livre reste lisible.
 */
async function addIllustrations(
  story: Story,
  req: StoryRequest,
  /** Portrait ressemblant déjà généré (fal), ou null. */
  portrait: { base64: string; mime: string } | null,
  /** Reçoit les raisons d'échec des illustrations (diagnostic). */
  errors: string[] = [],
): Promise<Story> {
  const style = req.style ?? "feerique";
  if (!illustrationsEnabled()) {
    return { ...story, style };
  }

  const heroName = req.childFirstName;
  // Indication visuelle propre au type de livre (imagier épuré, cherche-et-trouve détaillé…).
  const indiceFormat = findFormat(req.format)?.illustration;
  const base = hashSeed(story.titre + req.childFirstName);
  const commun = {
    style,
    heroName,
    appearance: req.appearance,
    premium: req.premium,
    recurringCharacters: story.personnages,
  };

  // 1. Fiches de référence (en parallèle, non stockées).
  const cast = (story.cast ?? []).filter((c) => c.nom.toLowerCase() !== heroName.toLowerCase()).slice(0, 4);
  const [ficheHeros, ...fichesCast] = await Promise.all([
    generateIllustration({
      ...commun,
      scene:
        `Character model sheet of the hero ${heroName}: full body, front view, standing in a friendly relaxed ` +
        "pose, wearing EXACTLY the hero outfit from the character sheet, plain soft light background, nothing else",
      referenceImage: portrait ? undefined : req.photo,
      anchorImage: portrait ?? undefined,
      seed: base + 500,
    }),
    ...cast.map((c, k) =>
      generateIllustration({
        ...commun,
        heroName: undefined,
        appearance: undefined,
        scene:
          `Character model sheet of ${c.nom}: ${c.visuel}. Full body, front view, alone, plain soft light ` +
          "background, nothing else. The species must be unmistakable at first glance.",
        seed: base + 600 + k,
      }),
    ),
  ]);
  if (ficheHeros.error) errors.push(ficheHeros.error);
  const ancre =
    ficheHeros.base64 !== undefined
      ? { base64: ficheHeros.base64, mime: ficheHeros.mime ?? "image/jpeg" }
      : portrait ?? undefined;
  const fiches = new Map<string, { base64: string; mime: string }>();
  fichesCast.forEach((f, k) => {
    if (f.base64) fiches.set(cast[k]!.nom, { base64: f.base64, mime: f.mime ?? "image/jpeg" });
  });

  // 2. Couverture + pages, toutes ancrées sur les fiches, en parallèle.
  const pageCentrale = story.pages[Math.floor(story.pages.length / 2)];
  // Couverture : les personnages de sa scène (page centrale) d'abord, puis les principaux.
  const couvertureFiches = (pageCentrale ? fichesPresentes(pageCentrale, fiches) : [])
    .concat([...fiches.entries()].map(([name, f]) => ({ name, ...f })))
    .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i)
    .slice(0, 3);
  const [cover, pages] = await Promise.all([
    generateIllustration({
      ...commun,
      scene:
        `Book cover illustration for the story "${story.titre}": ${heroName} in an exciting, emblematic moment ` +
        `of this story (${pageCentrale?.scene_illustration ?? ""})` +
        (couvertureFiches.length ? `, together with ${couvertureFiches.map((c) => c.name).join(" and ")}` : "") +
        ", rich setting, inviting composition, full body or medium shot, NOT a plain portrait",
      // Sans fiche du héros (échec), la photo garde la ressemblance.
      referenceImage: ancre ? undefined : req.photo,
      anchorImage: ancre,
      castRefs: couvertureFiches,
      seed: base,
    }),
    mapLimit(story.pages, 4, async (p, i) => {
      const { imageUrl, error } = await generateIllustration({
        ...commun,
        scene: indiceFormat ? `${p.scene_illustration}. ${indiceFormat}` : p.scene_illustration,
        referenceImage: ancre ? undefined : req.photo,
        anchorImage: ancre,
        castRefs: fichesPresentes(p, fiches),
        seed: base + i + 1,
      });
      if (error) errors.push(error);
      return { ...p, imageUrl };
    }),
  ]);
  if (cover.error) errors.push(cover.error);
  // Fiches conservées (stockage privé) pour pouvoir redessiner une page plus tard.
  const fichesUrls: Record<string, string> = {};
  fichesCast.forEach((f, k) => {
    if (f.imageUrl) fichesUrls[cast[k]!.nom] = f.imageUrl;
  });
  return {
    ...story,
    pages,
    couvertureUrl: cover.imageUrl,
    style,
    fiches: { heros: ficheHeros.imageUrl ?? null, cast: fichesUrls },
  };
}

/**
 * Étape 2 de la création : illustre une histoire déjà écrite, puis RÉPARE
 * automatiquement les images manquantes (un second essai, avec les mêmes
 * fiches de personnages) tant que le temps le permet.
 */
export async function illustrateStory(
  story: Story,
  req: StoryRequest,
  portrait: { base64: string; mime: string } | null,
): Promise<{ story: Story; imageReport?: string }> {
  const debut = Date.now();
  const errors: string[] = [];
  let illustre = await addIllustrations(story, req, portrait, errors);

  const manquantes = () =>
    (illustre.couvertureUrl ? 0 : 1) + illustre.pages.filter((p) => !p.imageUrl).length;
  if (manquantes() > 0 && Date.now() - debut < 180_000 && illustrationsEnabled()) {
    illustre = await reparer(illustre, req, errors);
  }
  // Contrôle « directeur artistique » : héros en double, personnage qui change
  // d'espèce ou de couleurs… les pages fautives sont redessinées.
  if (illustrationsEnabled() && controleActif() && Date.now() - debut < 210_000) {
    const { story: controle, bilan } = await controlerIllustrations(illustre, req, debut + 268_000);
    console.log("[livre]", bilan);
    illustre = controle;
  }
  return { story: illustre, imageReport: imageReportOf(illustre, errors) };
}

/** Redessine les images absentes avec les fiches conservées (héros + personnages). */
async function reparer(story: Story, req: StoryRequest, errors: string[]): Promise<Story> {
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
  const commun = {
    style: story.style ?? req.style ?? "feerique",
    heroName: req.childFirstName,
    appearance: req.appearance,
    premium: req.premium,
    recurringCharacters: story.personnages,
    referenceImage: ancre ? undefined : req.photo,
    anchorImage: ancre,
  };
  const graine = Date.now() % 1_000_000;
  const [cover, pages] = await Promise.all([
    story.couvertureUrl
      ? Promise.resolve(null)
      : generateIllustration({
          ...commun,
          scene: `Book cover illustration for the story "${story.titre}": ${req.childFirstName} in an emblematic moment, NOT a plain portrait`,
          castRefs: [...fiches.entries()].slice(0, 3).map(([name, f]) => ({ name, ...f })),
          seed: graine,
        }),
    mapLimit(story.pages, 4, async (p, i) => {
      if (p.imageUrl) return p;
      const r = await generateIllustration({ ...commun, scene: p.scene_illustration, castRefs: fichesPresentes(p, fiches), seed: graine + i + 1 });
      if (r.error) errors.push(r.error);
      return { ...p, imageUrl: r.imageUrl };
    }),
  ]);
  if (cover?.error) errors.push(cover.error);
  return { ...story, couvertureUrl: story.couvertureUrl ?? cover?.imageUrl ?? null, pages };
}

/** Fiches des personnages présents (exporté pour « redessiner une page »). */
export { fichesPresentes };

/**
 * Décrit en quelques mots l'apparence physique d'un enfant à partir d'une photo,
 * via Claude (multimodal). La photo n'est NI stockée NI renvoyée : seule une
 * courte description textuelle est produite, puis réutilisée pour dessiner un
 * personnage inspiré (jamais la vraie photo dans le livre).
 *
 * Renvoie "" en cas d'absence de photo valide ou d'échec.
 */
export async function describeAppearanceFromPhoto(
  dataUrl: string,
): Promise<string> {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) return "";
  const mediaType = (match[1] === "image/jpg" ? "image/jpeg" : match[1]) as
    | "image/png"
    | "image/jpeg"
    | "image/webp";
  const data = match[2] ?? "";
  // Garde-fou de taille, aligné sur la limite de corps des Server Actions (4 Mo) :
  // au-delà, la requête n'aurait de toute façon pas pu arriver jusqu'ici.
  if (data.length === 0 || data.length > 4_000_000) return "";

  try {
    const client = createClient();
    const response = await client.chat.completions.create(
      {
        model: env.groqVisionModel(),
        max_tokens: 120,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${data}` } },
              {
                type: "text",
                text:
                  "Décris en 10 mots maximum, en français, l'apparence physique générale " +
                  "de l'enfant sur cette photo (couleur de cheveux, coupe, couleur des yeux, " +
                  "lunettes éventuelles, teint). N'identifie jamais la personne, ne donne pas " +
                  "de nom, reste factuel et neutre. Réponds uniquement par la description.",
              },
            ],
          },
        ],
      },
      { timeout: 25_000 },
    );
    const texte = (response.choices[0]?.message?.content ?? "").trim();
    return texte.slice(0, 160);
  } catch {
    return "";
  }
}
