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
  blocMemoire,
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
import { blocModeles, exemplesParIds, exemplesPour } from "./bibliotheque";
import { PRIX_ESTIMES, noterDepense } from "./budget";
import { BIBLE, GRILLE, SEUIL_ACCEPTATION, reglesAge } from "./bible";

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
  const visibles = story.apercu ? story.pages.slice(0, PAGES_APERCU) : story.pages;
  const total = visibles.length + 1;
  const manquantes = (story.couvertureUrl ? 0 : 1) + visibles.filter((p) => !p.imageUrl).length;
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
  opts: { modele?: string; delaiMs?: number } = {},
): Promise<string> {
  // Écriture par un grand modèle (Claude via fal) : bien meilleur en français
  // et en cohérence. PAS de repli sur un modèle plus faible : mieux vaut
  // « réessayez dans quelques minutes » qu'une histoire mal écrite.
  // (Groq seulement si STORY_LLM=groq est choisi explicitement.)
  if (env.falApiKey() && process.env.STORY_LLM !== "groq") {
    const modele =
      opts.modele ??
      (premium
        ? process.env.STORY_MODEL_PREMIUM || "anthropic/claude-opus-5.5"
        : process.env.STORY_MODEL || "anthropic/claude-opus-5.5");
    let derniere = "";
    for (let essai = 0; essai < 2; essai++) {
      if (essai > 0) await new Promise((r) => setTimeout(r, 3000));
      try {
        const r = await fetch("https://fal.run/openrouter/router", {
          method: "POST",
          headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: modele,
            system_prompt: system,
            prompt: `${userMessage}\n\nRéponds UNIQUEMENT avec l'objet JSON demandé, sans texte autour.`,
            // (pas de « temperature » : imposée par le mode réflexion)
            reasoning: true,
            max_tokens: 16000,
          }),
          // L'écriture d'une longue histoire (plan + 12 pages) peut dépasser 2 minutes :
          // elle a sa propre exécution, on lui laisse jusqu'à ~4 min.
          signal: AbortSignal.timeout(opts.delaiMs ?? (temperature < 0.6 ? 70_000 : 240_000)),
        });
        const j = (await r.json().catch(() => ({}))) as { output?: string; error?: unknown; detail?: unknown; usage?: { cost?: number } };
        if (r.ok) await noterDepense(j.usage?.cost ?? (opts.modele ? PRIX_ESTIMES.relecture : PRIX_ESTIMES.texte));
        if (r.ok && j.output && j.output.includes("{")) {
          if (info) info.viaFal = true;
          console.log("[texte] écrit par", modele);
          return j.output.trim();
        }
        derniere = `${r.status} ${JSON.stringify(j.error ?? j.detail ?? j).slice(0, 200)}`;
        if (/TOP_UP|locked|balance/i.test(derniere)) break; // inutile de réessayer
      } catch (e) {
        derniere = String(e).slice(0, 200);
        // Délai dépassé : un nouvel essai ne tiendrait pas dans le temps restant
        // (et fal facture souvent l'appel abandonné).
        if (/abort|timeout/i.test(derniere)) break;
      }
    }
    console.error("[texte] écriture impossible :", derniere);
    if (/TOP_UP|locked|balance/i.test(derniere)) {
      const { alerterAdmin } = await import("./notifications");
      await alerterAdmin("crédit fal épuisé — plus aucune histoire ne peut être écrite", `Rechargez le compte sur fal.ai (Billing). ${derniere}`);
    }
    throw new Error(`écriture indisponible : ${derniere}`);
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

/** Prompt de la relectrice (éditrice jeunesse) : document « Bible féerique et grille de relecture ». */
const RELECTRICE_SYSTEM = `Tu es éditeur jeunesse exigeant pour Encore une histoire.
Tu n'as pas écrit ce texte et tu ne cherches pas à le défendre.

${BIBLE}

${GRILLE}

ÉTAPES
1. Vérifie d'abord les motifs éliminatoires.
2. Note chaque critère de 1 à 5 et justifie en une phrase qui cite le passage concerné.
3. En cas de refus, donne au plus 5 corrections précises, par page.

Réponds uniquement en JSON :
{"eliminatoire": null, "notes": {"voix_haute": 0, "ritournelle": 0, "structure": 0, "enfant_agit": 0, "personnalisation": 0, "feerique": 0, "age": 0, "fin": 0}, "justifications": {"voix_haute": "…"}, "total": 0, "verdict": "accepte | reecrire", "corrections": [{"page": 3, "probleme": "…", "piste": "…"}]}
("eliminatoire" : null, ou le motif éliminatoire constaté, en une phrase.)`;

/** Consignes de la réécriture : ne modifier que les pages citées. */
const REECRITURE_SYSTEM = `Tu es auteur jeunesse pour Encore une histoire. Ton éditeur a relu ton histoire et demande des corrections.

${BIBLE}

Corrige l'histoire selon les corrections reçues, en NE MODIFIANT QUE LES PAGES CITÉES (et le titre seulement si une correction le demande). Garde le même héros, la même intrigue, les mêmes personnages, la même ritournelle mot pour mot.
Réponds UNIQUEMENT avec ce JSON, qui ne contient QUE les pages réécrites :
{"titre": "seulement si tu le changes, sinon omets ce champ", "pages": [{"page": 3, "texte": "nouveau texte de la page 3", "scene_illustration": "en anglais, seulement si la scène change, sinon omets ce champ"}]}`;

type Verdict = {
  eliminatoire?: string | null;
  notes?: Record<string, number>;
  total?: number;
  corrections?: { page?: number; probleme?: string; piste?: string }[];
};

/**
 * Étape 3 : la relecture. Une deuxième IA (qui ne voit pas la conversation de
 * l'autrice) note l'histoire avec la grille. Acceptée à 32/40, sans critère
 * sous 3 et sans motif éliminatoire ; sinon l'autrice réécrit les pages citées,
 * deux fois au maximum. Après deux échecs, l'histoire part en file de relecture
 * humaine (on garde la meilleure version). Borné dans le temps, jamais bloquant.
 */
async function relireEtAmeliorer(
  client: OpenAI,
  model: string,
  story: Story,
  req: StoryRequest,
  debut: number,
  extraits: string,
): Promise<Story> {
  const juger = async (s: Story): Promise<Verdict | null> => {
    if (Date.now() - debut > 200_000) return null;
    const histoire = JSON.stringify({ titre: s.titre, pages: s.pages.map((p, i) => ({ page: i + 1, texte: p.texte })) });
    const message = [
      `Âge de l'enfant : ${req.childAge} ans. Prénom : ${req.childFirstName}.`,
      `Règles de longueur : ${reglesAge(req.childAge)}`,
      "",
      `PLAN\n${JSON.stringify(s.plan ?? {})}`,
      "",
      `MÉMOIRE DE L'ENFANT\n${blocMemoire(req) || "(aucune)"}`,
      "",
      `EXTRAITS FOURNIS À L'AUTEUR\n${extraits || "(aucun)"}`,
      "",
      `HISTOIRE À JUGER\n${histoire}`,
    ].join("\n");
    try {
      const raw = await callModel(client, model, RELECTRICE_SYSTEM, message, 0.3, false, undefined, {
        modele: process.env.STORY_CRITIC_MODEL || "anthropic/claude-sonnet-5.5",
        delaiMs: 60_000,
      });
      return JSON.parse(/\{[\s\S]*\}/.exec(raw)?.[0] ?? "null") as Verdict | null;
    } catch (e) {
      console.error("[relecture] indisponible :", String(e).slice(0, 160));
      return null;
    }
  };
  const bilan = (v: Verdict) => {
    const notes = Object.values(v.notes ?? {}).filter((n): n is number => typeof n === "number");
    const total = notes.length ? notes.reduce((a, b) => a + b, 0) : v.total ?? 0;
    const elim = v.eliminatoire && String(v.eliminatoire).toLowerCase() !== "null" ? String(v.eliminatoire) : null;
    const accepte = !elim && total >= SEUIL_ACCEPTATION && notes.length > 0 && Math.min(...notes) >= 3;
    const problemes = [
      ...(elim ? [`Éliminatoire : ${elim}`] : []),
      ...(v.corrections ?? []).slice(0, 5).map((c) => `${c.page ? `p. ${c.page} : ` : ""}${c.probleme ?? ""}${c.piste ? ` → ${c.piste}` : ""}`),
    ];
    return { total, accepte, elim, problemes, notes: v.notes };
  };

  let actuelle = story;
  let verdict = await juger(actuelle);
  if (!verdict) return story;
  let b = bilan(verdict);
  let meilleure = { story: actuelle, b };
  let essais = 0;
  console.log("[relecture] total", b.total, b.accepte ? "accepté" : "à réécrire");

  while (!b.accepte && essais < 2 && Date.now() - debut < 190_000) {
    essais++;
    try {
      const raw = await callModel(
        client,
        model,
        REECRITURE_SYSTEM,
        `Âge de l'enfant : ${req.childAge} ans.\nRègles de longueur : ${reglesAge(req.childAge)}\n\nCORRECTIONS\n- ${b.problemes.join("\n- ")}\n\nPLAN\n${JSON.stringify(actuelle.plan ?? {})}\n\nHISTOIRE\n${JSON.stringify({ titre: actuelle.titre, pages: actuelle.pages.map((p, i) => ({ page: i + 1, texte: p.texte, scene_illustration: p.scene_illustration })) })}`,
        0.5,
        req.premium,
        undefined,
        { delaiMs: Math.max(30_000, 265_000 - (Date.now() - debut)) },
      );
      // Seules les pages corrigées reviennent : on les remet à leur place.
      const json = JSON.parse(/\{[\s\S]*\}/.exec(raw)?.[0] ?? "null") as {
        titre?: string;
        pages?: { page?: number; texte?: string; scene_illustration?: string }[];
      } | null;
      const corrigees = (json?.pages ?? []).filter(
        (p) => typeof p.page === "number" && p.page >= 1 && p.page <= actuelle.pages.length && typeof p.texte === "string" && p.texte.trim().length > 0,
      );
      if (!corrigees.length) break;
      const candidate: Story = {
        ...actuelle,
        titre: json?.titre?.trim() || actuelle.titre,
        pages: actuelle.pages.map((p, i) => {
          const c = corrigees.find((x) => x.page === i + 1);
          return c ? { ...p, texte: c.texte!.trim(), scene_illustration: c.scene_illustration?.trim() || p.scene_illustration } : p;
        }),
      };
      if (texteEnAnglais(candidate) || !filterStory(candidate).ok) break;
      const texte = [candidate.titre, ...candidate.pages.map((p) => `${p.texte} ${p.scene_illustration}`)].join(" ");
      if (findProtectedNames(texte).length > 0) break;
      actuelle = candidate;
    } catch (e) {
      console.error("[réécriture] impossible :", String(e).slice(0, 160));
      break;
    }
    verdict = await juger(actuelle);
    if (!verdict) break;
    b = bilan(verdict);
    console.log("[relecture] réécriture", essais, "total", b.total, b.accepte ? "accepté" : "refusé");
    if (b.accepte || b.total >= meilleure.b.total) meilleure = { story: actuelle, b };
  }

  const finale = meilleure;
  return {
    ...finale.story,
    qualite: {
      note: Math.round((finale.b.total / 4) * 10) / 10, // sur 10 (affichage)
      total: finale.b.total,
      notes: finale.b.notes,
      problemes: finale.b.problemes,
      accepte: finale.b.accepte,
      eliminatoire: finale.b.elim,
      reecrit: essais > 0,
      essais,
      // Après deux réécritures refusées : file de relecture humaine.
      aRevoir: !finale.b.accepte && essais >= 2,
    },
  };
}

/**
 * Relecture (et réécritures) d'une histoire déjà écrite, dans sa propre
 * exécution : la relectrice reçoit les mêmes extraits que l'autrice.
 */
export async function relireHistoire(story: Story, req: StoryRequest): Promise<Story> {
  const client = createClient();
  const model = req.premium ? env.groqModelPremium() : env.groqModel();
  const ids = story.meta?.modeles ?? [];
  const tous = ids.length ? await exemplesParIds(ids) : [];
  const extraits = blocModeles({ extraits: tous.filter((e) => e.type === "extrait"), trame: tous.find((e) => e.type === "trame") ?? null });
  return relireEtAmeliorer(client, model, story, req, Date.now(), extraits);
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
  { illustrer = true, relire = true }: { illustrer?: boolean; relire?: boolean } = {},
): Promise<GenerateResult> {
  const debut = Date.now();
  // RAG : extraits modèles (ton) + trame (structure) les plus proches de la demande.
  const modeles = await exemplesPour({
    age: req.childAge,
    format: req.format,
    themeId: req.mode === "theme" ? req.themeId : undefined,
    childId: req.childId,
  });
  let userMessage = buildUserMessage(req, blocModeles(modeles));
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
    let base: Story = polished ?? parsed.story;
    // Relecture notée par une deuxième IA ; réécriture si la note est basse.
    if (info.viaFal && relire) base = await relireEtAmeliorer(client, model, base, req, debut, blocModeles(modeles));
    base = {
      ...base,
      meta: {
        age: req.childAge,
        format: req.format,
        themeId: req.mode === "theme" ? req.themeId : undefined,
        mode: req.mode,
        trame: modeles.trame?.id,
        prompt: req.prompt?.slice(0, 400),
        modeles: [...modeles.extraits.map((e) => e.id), ...(modeles.trame ? [modeles.trame.id] : [])],
      },
    };

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

/** Aperçu gratuit : nombre de pages illustrées (en plus de la couverture). */
export const PAGES_APERCU = 3;

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
  const cast = (story.cast ?? []).filter((c) => c.nom.toLowerCase() !== heroName.toLowerCase()).slice(0, 3);
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
      // Aperçu gratuit : les pages suivantes seront dessinées au déblocage.
      if (req.apercu && i >= PAGES_APERCU) return { ...p, imageUrl: null };
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
    ...(req.apercu ? { apercu: true } : {}),
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
    (illustre.couvertureUrl ? 0 : 1) +
    illustre.pages.filter((p, i) => !p.imageUrl && !(illustre.apercu && i >= PAGES_APERCU)).length;
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

/**
 * Livre gratuit débloqué (achat ou Club) : dessine toutes les pages restantes
 * avec les mêmes fiches de personnages, puis contrôle les nouvelles images.
 */
export async function illustrerLivreComplet(story: Story, req: StoryRequest): Promise<{ story: Story; imageReport?: string }> {
  const debut = Date.now();
  const errors: string[] = [];
  let complet = await reparer({ ...story, apercu: false }, req, errors);
  if (controleActif() && Date.now() - debut < 150_000) {
    const { story: controle, bilan } = await controlerIllustrations(complet, req, debut + 260_000);
    console.log("[livre] déblocage,", bilan);
    complet = controle;
  }
  return { story: complet, imageReport: imageReportOf(complet, errors) };
}

/**
 * Épisode de série : UNE grande illustration d'ouverture, dessinée avec les
 * fiches de la série (même héros, mêmes compagnons). Les autres pages restent
 * en texte ; elles seront illustrées dans le tome imprimé.
 */
export async function illustrerEpisode(story: Story, req: StoryRequest): Promise<{ story: Story; imageReport?: string }> {
  const versRef = async (u: string | null | undefined) => {
    const d = await fetchAsDataUrl(u, { maxPx: 1024, quality: 86 });
    const m = d ? /^data:([^;]+);base64,(.+)$/.exec(d) : null;
    return m ? { mime: m[1] as string, base64: m[2] as string } : undefined;
  };
  const ancre = await versRef(story.fiches?.heros);
  const fiches = new Map<string, { base64: string; mime: string }>();
  for (const [nom, url] of Object.entries(story.fiches?.cast ?? {})) {
    const r = await versRef(url);
    if (r) fiches.set(nom, r);
  }
  const page = story.pages[0]!;
  const errors: string[] = [];
  const r = await generateIllustration({
    style: story.style ?? req.style ?? "feerique",
    scene: `Opening illustration of this episode: ${page.scene_illustration}`,
    heroName: req.childFirstName,
    appearance: req.appearance,
    premium: req.premium,
    recurringCharacters: story.personnages,
    anchorImage: ancre,
    castRefs: fichesPresentes(page, fiches),
    seed: hashSeed(story.titre + req.childFirstName),
  });
  if (r.error) errors.push(r.error);
  const illustre: Story = { ...story, couvertureUrl: r.imageUrl ?? null };
  return { story: illustre, imageReport: r.imageUrl ? undefined : `Illustration manquante : 1/1. ${errors[0] ?? ""}`.slice(0, 300) };
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
      if (p.imageUrl || (story.apercu && i >= PAGES_APERCU)) return p;
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
