/**
 * Planches des histoires toutes prêtes : chaque page est dessinée UNE fois par
 * histoire (et par style), avec un enfant « neutre » et un doudou neutre, puis
 * validée par l'administrateur. Pour chaque livre, on ne retouche que l'enfant
 * (visage, cheveux) et le doudou : une image par page, au lieu de redessiner
 * toute la scène. Poucet trop grand, chemin pavé, personnage en trop, prénom
 * écrit dans le ciel : ces défauts ne peuvent plus arriver, la scène validée
 * n'est jamais redessinée.
 *
 * Pages où l'on voit le parent : deux variantes (homme : Papa, Papi ; femme :
 * Maman, Mamie). Pages sans l'enfant ni le doudou : la planche est reprise telle
 * quelle, sans aucun coût.
 */

import "server-only";
import { prisma } from "./prisma";
import { env } from "./env";
import { falFetch } from "./jetonsFal";
import { noterDepense, PRIX_ESTIMES } from "./budget";
import { fetchAsDataUrl } from "./imageFetch";
import { generateIllustration, retoucherPlanche } from "./illustration";
import { HISTOIRES_MAITRESSES, type HistoireMaitresse, type Personnalisation } from "./histoiresMaitresses";
import { construireLivre } from "./maitresseGenerateur";
import { consoliderFiche } from "./ficheHistoire";
import { CONSIGNE_COUVERTURE } from "./bibleVisuelle";
import { cheveuxDifferents, especeAttendue, estPeluche, memeEspece } from "./controleIllustrations";
import { mapLimit } from "./parallele";
import type { Story } from "./storySchema";
import type { StoryRequest } from "./storyPrompt";
import type { IllustrationStyle } from "./style_config";

type Ref = { base64: string; mime: string };
export type Variante = "homme" | "femme";

/** L'enfant et le doudou « neutres » des planches (remplacés à chaque livre). */
const APPARENCE_NEUTRE = "a 5-year-old child with short tousled light-brown hair, brown eyes and light skin";
const DOUDOU_NEUTRE = "a plain soft beige plush teddy bear with round ears and a cream muzzle";
const ENFANT = "the child";

function persoNeutre(variante: Variante): Personnalisation {
  return {
    prenom: ENFANT,
    fille: false,
    doudou: "Doudou",
    sonDoudou: "son doudou",
    doudouVisuel: DOUDOU_NEUTRE,
    parent: variante === "femme" ? "Maman" : "Papa",
    passages: {},
  };
}

export function histoireParId(id: string | undefined): HistoireMaitresse | undefined {
  return HISTOIRES_MAITRESSES.find((h) => h.id === id);
}

export interface ClePlanche {
  cle: string;
  /** -1 : couverture ; sinon index de page (0 = première page). */
  index: number;
  variante: Variante | null;
  enfant: boolean;
  doudou: boolean;
}

const avecParent = (t: string) => t.includes("{parent}") || t.includes("{dit_parent}") || t.includes("{petit_parent}");
const avecEnfant = (t: string) => t.includes("{prenom}") || t.includes("{Il}") || t.includes("{il}");
const avecDoudou = (t: string) => t.includes("{doudou}") || t.includes("{son_doudou}");

/** Toutes les planches d'une histoire (couverture, pages, variantes du parent). */
export function clesPlanches(h: HistoireMaitresse): ClePlanche[] {
  const sources = [{ index: -1, scene: h.couverture }, ...h.pages.map((p, i) => ({ index: i, scene: p.scene }))];
  return sources.flatMap(({ index, scene }): ClePlanche[] => {
    const base = index === -1 ? "couverture" : `p${index + 1}`;
    const commun = { index, enfant: avecEnfant(scene), doudou: avecDoudou(scene) };
    return avecParent(scene)
      ? (["homme", "femme"] as const).map((v) => ({ ...commun, cle: `${base}:${v}`, variante: v }))
      : [{ ...commun, cle: base, variante: null }];
  });
}

/** La planche à utiliser pour une page et une variante. */
export function clePour(h: HistoireMaitresse, index: number, variante: Variante): ClePlanche | undefined {
  return clesPlanches(h).find((k) => k.index === index && (k.variante === null || k.variante === variante));
}

/* ─── Stockage ─── */

let pret: Promise<unknown> | null = null;
function table(): Promise<unknown> {
  pret ??= prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "Planche" (histoire TEXT NOT NULL, style TEXT NOT NULL, cle TEXT NOT NULL, url TEXT NOT NULL, valide BOOLEAN NOT NULL DEFAULT FALSE, "creeLe" TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (histoire, style, cle))`,
    )
    .catch((e) => {
      pret = null;
      throw e;
    });
  return pret;
}

export async function lirePlanches(histoire: string, style: string): Promise<Map<string, { url: string; valide: boolean }>> {
  try {
    await table();
    const rows = await prisma.$queryRaw<{ cle: string; url: string; valide: boolean }[]>`
      SELECT cle, url, valide FROM "Planche" WHERE histoire = ${histoire} AND style = ${style}`;
    return new Map(rows.map((r) => [r.cle, { url: r.url, valide: r.valide }]));
  } catch {
    return new Map();
  }
}

async function enregistrer(histoire: string, style: string, cle: string, url: string): Promise<void> {
  await table();
  await prisma.$executeRaw`
    INSERT INTO "Planche" (histoire, style, cle, url, valide) VALUES (${histoire}, ${style}, ${cle}, ${url}, FALSE)
    ON CONFLICT (histoire, style, cle) DO UPDATE SET url = EXCLUDED.url, valide = FALSE, "creeLe" = NOW()`;
}

export async function validerPlanche(histoire: string, style: string, cle: string, valide: boolean): Promise<void> {
  await table();
  await prisma.$executeRaw`UPDATE "Planche" SET valide = ${valide} WHERE histoire = ${histoire} AND style = ${style} AND cle = ${cle}`;
}

/** Retire une planche : elle sera redessinée au prochain « dessiner les planches manquantes ». */
export async function effacerPlanche(histoire: string, style: string, cle: string): Promise<void> {
  await table();
  await prisma.$executeRaw`DELETE FROM "Planche" WHERE histoire = ${histoire} AND style = ${style} AND cle = ${cle}`;
}

/** Toutes les planches de pages (pas les fiches) sont dessinées ET validées. */
export async function planchesPretes(h: HistoireMaitresse, style: string): Promise<boolean> {
  const m = await lirePlanches(h.id, style);
  return clesPlanches(h).every((k) => m.get(k.cle)?.valide);
}

export async function etatPlanches(h: HistoireMaitresse, style: string) {
  const m = await lirePlanches(h.id, style);
  const cles = clesPlanches(h);
  return {
    total: cles.length,
    dessinees: cles.filter((k) => m.has(k.cle)).length,
    validees: cles.filter((k) => m.get(k.cle)?.valide).length,
    planches: cles.map((k) => ({ ...k, url: m.get(k.cle)?.url ?? null, valide: Boolean(m.get(k.cle)?.valide) })),
  };
}

/* ─── Dessin des planches (une fois par histoire, payant) ─── */

const enRef = (d: string | null): Ref | null => {
  const m = d ? /^data:([^;]+);base64,(.+)$/.exec(d) : null;
  return m ? { mime: m[1]!, base64: m[2]! } : null;
};
const lireRef = async (url: string | null | undefined) => enRef(await fetchAsDataUrl(url, { maxPx: 1024, quality: 88 }));

/** Personnages présents sur une page (déclarés, sinon nommés dans la scène), avec leur fiche. */
function presents(p: Story["pages"][number], fiches: Map<string, Ref>): { name: string; base64: string; mime: string }[] {
  const noms = [...fiches.keys()].filter((nom) =>
    p.presents ? p.presents.some((x) => x.toLowerCase() === nom.toLowerCase()) : p.scene_illustration.toLowerCase().includes(nom.toLowerCase()),
  );
  return noms.slice(0, 3).map((name) => ({ name, ...fiches.get(name)! }));
}

/**
 * Dessine les planches manquantes d'une histoire (fiches neutres d'abord),
 * jusqu'à `limite` (horodatage). À relancer tant qu'il en manque.
 */
export async function dessinerPlanches(h: HistoireMaitresse, style: IllustrationStyle, limite: number): Promise<{ dessinees: number; erreurs: string[] }> {
  const existantes = await lirePlanches(h.id, style);
  const erreurs: string[] = [];
  let dessinees = 0;
  const livres = {
    homme: consoliderFiche(construireLivre(h, persoNeutre("homme"), { style, age: h.ageMin })),
    femme: consoliderFiche(construireLivre(h, persoNeutre("femme"), { style, age: h.ageMin })),
  };
  const commun = { style, heroName: ENFANT, appearance: APPARENCE_NEUTRE, carre: true };

  // 1. Fiches neutres : l'enfant, puis chaque personnage (doudou neutre compris).
  const fichesVoulues = [
    { cle: "fiche:enfant", scene: `Character model sheet of ${ENFANT}: full body, front view, standing, wearing EXACTLY the hero outfit from the character sheet, plain soft light background, nothing else, no text`, hero: true },
    ...(livres.homme.cast ?? []).map((c) => ({
      cle: `fiche:${c.nom}`,
      scene: `Character model sheet of ${c.nom}: ${c.visuel}. Full body, front view, alone, plain soft light background, nothing else, no text. The species must be unmistakable at first glance.`,
      hero: false,
    })),
  ];
  await mapLimit(
    fichesVoulues.filter((f) => !existantes.has(f.cle)),
    4,
    async (f, k) => {
      const r = await generateIllustration({
        ...commun,
        ...(f.hero ? {} : { heroName: undefined, appearance: undefined }),
        recurringCharacters: livres.homme.personnages,
        scene: f.scene,
        seed: 90_000 + k,
      });
      if (r.imageUrl) {
        await enregistrer(h.id, style, f.cle, r.imageUrl);
        // Les fiches ne se valident pas une à une : elles servent seulement de référence.
        await validerPlanche(h.id, style, f.cle, true);
        existantes.set(f.cle, { url: r.imageUrl, valide: true });
        dessinees++;
      } else erreurs.push(`${f.cle} : ${r.error ?? "échec"}`);
    },
  );

  const ancre = await lireRef(existantes.get("fiche:enfant")?.url);
  const fiches = new Map<string, Ref>();
  for (const c of livres.homme.cast ?? []) {
    const r = await lireRef(existantes.get(`fiche:${c.nom}`)?.url);
    if (r) fiches.set(c.nom, r);
  }

  // 2. Pages et couverture (les deux variantes du parent quand il apparaît).
  const aDessiner = clesPlanches(h).filter((k) => !existantes.has(k.cle));
  await mapLimit(aDessiner, 4, async (k, n) => {
    if (Date.now() > limite) return;
    const livre = livres[k.variante ?? "homme"];
    const page = k.index >= 0 ? livre.pages[k.index] : null;
    const scene = page
      ? page.scene_illustration
      : `Book cover illustration for the story "${livre.titre.replace(ENFANT, "").trim()}": ${livre.couvertureScene ?? ""}. ${CONSIGNE_COUVERTURE}`;
    const refs = page ? presents(page, fiches) : [...fiches.entries()].slice(0, 3).map(([name, f]) => ({ name, ...f }));
    const r = await generateIllustration({
      ...commun,
      recurringCharacters: livre.personnages,
      scene,
      anchorImage: ancre ?? undefined,
      castRefs: refs,
      seed: 91_000 + n + Math.floor(Math.random() * 500),
    });
    if (r.imageUrl) {
      await enregistrer(h.id, style, k.cle, r.imageUrl);
      dessinees++;
    } else erreurs.push(`${k.cle} : ${r.error ?? "échec"}`);
  });
  return { dessinees, erreurs };
}

/* ─── Un livre à partir des planches ─── */

/**
 * Illustre le livre d'un enfant à partir des planches validées : fiche du héros
 * et du doudou, puis une retouche par page où ils apparaissent. Renvoie null si
 * les planches ne sont pas prêtes (le livre est alors dessiné comme avant).
 * `limitePages` : nombre de pages à illustrer (aperçu gratuit) ; les pages qui
 * ont déjà une image sont gardées (déblocage d'un aperçu).
 */
export async function illustrerDepuisPlanches(
  story: Story,
  req: StoryRequest,
  portrait: Ref | null,
  errors: string[],
  limitePages: number | null,
): Promise<Story | null> {
  const h = histoireParId(story.planches?.histoire);
  const style = story.style ?? req.style ?? "anim3d";
  if (!h || !story.planches || !(await planchesPretes(h, style))) return null;
  const variante = story.planches.variante;
  const m = await lirePlanches(h.id, style);

  const doudou = (story.cast ?? []).find((c) => estPeluche(c.visuel));
  const commun = { style, heroName: req.childFirstName, appearance: req.appearance, recurringCharacters: story.personnages, carre: true };

  // Fiches de ce livre : gardées si elles existent déjà (déblocage), sinon dessinées une fois.
  let herosUrl = story.fiches?.heros ?? null;
  let doudouUrl = doudou ? story.fiches?.cast?.[doudou.nom] ?? null : null;
  const [fh, fd] = await Promise.all([
    herosUrl
      ? null
      : generateIllustration({
          ...commun,
          scene: `Character model sheet of the hero ${req.childFirstName}: full body, front view, standing in a friendly relaxed pose, wearing EXACTLY the hero outfit from the character sheet, plain soft light background, nothing else, no text`,
          referenceImage: portrait ? undefined : req.photo,
          anchorImage: portrait ?? undefined,
          seed: 7_000 + (Date.now() % 1000),
        }),
    doudou && !doudouUrl
      ? generateIllustration({
          ...commun,
          heroName: undefined,
          appearance: undefined,
          scene: `Character model sheet of ${doudou.nom}: ${doudou.visuel}. Full body, front view, alone, plain soft light background, nothing else, no text. The species must be unmistakable at first glance.`,
          seed: 7_500 + (Date.now() % 1000),
        })
      : null,
  ]);
  if (fh) {
    if (fh.error) errors.push(fh.error);
    herosUrl = fh.imageUrl;
  }
  if (fd) {
    if (fd.error) errors.push(fd.error);
    doudouUrl = fd.imageUrl;
  }
  const herosRef = fh?.base64 ? { base64: fh.base64, mime: fh.mime ?? "image/jpeg" } : await lireRef(herosUrl);
  const doudouRef = fd?.base64 ? { base64: fd.base64, mime: fd.mime ?? "image/jpeg" } : await lireRef(doudouUrl);
  if (!herosRef) return null; // sans fiche du héros, on retombe sur le dessin complet

  const cibles = [-1, ...story.pages.map((_, i) => i)].filter((i) => (limitePages === null || i < limitePages) && !(i >= 0 ? story.pages[i]!.imageUrl : story.couvertureUrl));
  const retouchees = new Set(story.planches.retouchees ?? []);
  const resultats = await mapLimit(cibles, 4, async (i) => {
    const k = clePour(h, i, variante);
    const planche = k ? m.get(k.cle) : undefined;
    if (!k || !planche) return { i, url: null as string | null };
    if (!k.enfant && !k.doudou) return { i, url: planche.url }; // reprise telle quelle, gratuite
    const ref = await lireRef(planche.url);
    if (!ref) return { i, url: null };
    const r = await retoucherPlanche({
      planche: ref,
      heros: k.enfant ? herosRef : undefined,
      doudou: k.doudou && doudouRef ? doudouRef : undefined,
      seed: 8_000 + i * 37 + (Date.now() % 997),
    });
    if (r.error) errors.push(r.error);
    if (r.imageUrl) retouchees.add(i);
    return { i, url: r.imageUrl };
  });
  const par = new Map(resultats.map((x) => [x.i, x.url]));
  return {
    ...story,
    couvertureUrl: story.couvertureUrl ?? par.get(-1) ?? null,
    pages: story.pages.map((p, i) => (p.imageUrl ? p : { ...p, imageUrl: par.get(i) ?? null })),
    fiches: { heros: herosUrl, cast: { ...(story.fiches?.cast ?? {}), ...(doudou && doudouUrl ? { [doudou.nom]: doudouUrl } : {}) } },
    planches: { ...story.planches, retouchees: [...retouchees] },
  };
}

/** Une page refaite à la demande du parent : nouvelle retouche de la même planche. */
export async function retoucherPage(story: Story, index: number): Promise<string | null> {
  const h = histoireParId(story.planches?.histoire);
  if (!h || !story.planches) return null;
  const m = await lirePlanches(h.id, story.style ?? "anim3d");
  const k = clePour(h, index, story.planches.variante);
  const planche = k ? m.get(k.cle) : undefined;
  if (!k || !planche) return null;
  if (!k.enfant && !k.doudou) return planche.url;
  const doudou = (story.cast ?? []).find((c) => estPeluche(c.visuel));
  const [ref, heros, dd] = await Promise.all([
    lireRef(planche.url),
    lireRef(story.fiches?.heros),
    doudou ? lireRef(story.fiches?.cast?.[doudou.nom]) : Promise.resolve(null),
  ]);
  if (!ref || !heros) return null;
  const r = await retoucherPlanche({ planche: ref, heros: k.enfant ? heros : undefined, doudou: k.doudou && dd ? dd : undefined, seed: Date.now() % 1_000_000 });
  return r.imageUrl;
}

/* ─── Relecture des retouches : deux questions seulement ─── */

async function inspecter(heros: Ref, doudou: Ref | null, page: Ref): Promise<{ hair_page?: string; hair_reference?: string; plush_animal?: string } | null> {
  const images = [page, heros, ...(doudou ? [doudou] : [])].map((r) => `data:${r.mime};base64,${r.base64}`);
  const prompt = [
    "Image 1 is a book page. Answer in JSON only.",
    '"hair_page": FIRST, looking only at image 1, the hair color of the big child, one word among: blond, light brown, chestnut, dark brown, black, red, grey (lit parts, not shadows).',
    '"plush_animal": looking only at image 1, the animal the plush toy ACTUALLY looks like (ears, muzzle, tail), "" if there is no plush toy.',
    '"hair_reference": then, the hair color of the child in image 2, same word list.',
    'JSON: {"hair_page": "", "plush_animal": "", "hair_reference": ""}',
  ].join("\n");
  try {
    const r = await falFetch(
      "https://fal.run/openrouter/router/vision",
      {
        method: "POST",
        headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
        // Deux questions simples : un modèle sans réflexion suffit (quelques dixièmes de centime).
        body: JSON.stringify({ model: process.env.QA_RETOUCHE_MODEL || "anthropic/claude-sonnet-4.5", prompt, image_urls: images, max_tokens: 200, temperature: 0 }),
      },
      40_000,
    );
    const j = (await r.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
    if (r.ok) await noterDepense(j.usage?.cost ?? PRIX_ESTIMES.vision);
    const json = /\{[\s\S]*\}/.exec(j.output ?? "")?.[0];
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

/**
 * Contrôle des pages retouchées : couleur des cheveux et animal du doudou.
 * Une seule reprise par page fautive ; ensuite, le bouton « redessiner » du parent.
 */
export async function controlerRetouches(story: Story, limite: number): Promise<{ story: Story; bilan: string }> {
  const retouchees = story.planches?.retouchees ?? [];
  const heros = await lireRef(story.fiches?.heros);
  if (!heros || !retouchees.length) return { story, bilan: "contrôle : rien à vérifier" };
  const doudou = (story.cast ?? []).find((c) => estPeluche(c.visuel));
  const doudouRef = doudou ? await lireRef(story.fiches?.cast?.[doudou.nom]) : null;
  const espece = doudou ? especeAttendue(doudou.visuel) : null;
  const h = histoireParId(story.planches?.histoire);

  let refaites = 0;
  const nouvelles = new Map<number, string>();
  await mapLimit(retouchees, 4, async (i) => {
    if (Date.now() > limite) return;
    const url = i === -1 ? story.couvertureUrl : story.pages[i]?.imageUrl;
    const page = await lireRef(url);
    if (!page) return;
    const v = await inspecter(heros, doudouRef, page);
    if (!v) return;
    const k = h && story.planches ? clePour(h, i, story.planches.variante) : undefined;
    const fautes: string[] = [];
    if (k?.enfant && cheveuxDifferents(v.hair_reference, v.hair_page)) fautes.push(`the child's hair must be ${v.hair_reference}, not ${v.hair_page}`);
    if (k?.doudou && espece && v.plush_animal && !memeEspece(espece, v.plush_animal)) fautes.push(`the plush toy must be a ${espece}, not a ${v.plush_animal}`);
    if (!fautes.length || !h || !k) return;
    const m = await lirePlanches(h.id, story.style ?? "anim3d");
    const planche = await lireRef(m.get(k.cle)?.url);
    if (!planche) return;
    const r = await retoucherPlanche({
      planche,
      heros: k.enfant ? heros : undefined,
      doudou: k.doudou && doudouRef ? doudouRef : undefined,
      correction: fautes.join("; "),
      seed: 9_000 + i * 41 + (Date.now() % 997),
    });
    if (r.imageUrl) {
      nouvelles.set(i, r.imageUrl);
      refaites++;
    }
  });
  return {
    story: {
      ...story,
      couvertureUrl: nouvelles.get(-1) ?? story.couvertureUrl,
      pages: story.pages.map((p, i) => (nouvelles.has(i) ? { ...p, imageUrl: nouvelles.get(i)! } : p)),
      controleImages: { verifiees: retouchees.length, refaites, nonVerifiees: 0 },
    },
    bilan: `contrôle des retouches : ${retouchees.length} vérifiées, ${refaites} refaites`,
  };
}
