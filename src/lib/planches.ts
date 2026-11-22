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
import { consoliderFiche, signature } from "./ficheHistoire";
import { CONSIGNE_COUVERTURE, grillePour } from "./bibleVisuelle";
import { cheveuxDifferents, especeAttendue, estPeluche, memeEspece, teintsDifferents, texturesDifferentes, verifier } from "./controleIllustrations";
import { mapLimit } from "./parallele";
import type { Story } from "./storySchema";
import type { StoryRequest } from "./storyPrompt";
import type { IllustrationStyle } from "./style_config";

type Ref = { base64: string; mime: string };
export type Variante = "homme" | "femme";

/** L'enfant et le doudou « neutres » des planches (remplacés à chaque livre). */
export const APPARENCE_NEUTRE = "a 5-year-old child with short tousled light-brown hair, brown eyes and light skin";
const DOUDOU_NEUTRE = "a plain soft beige plush teddy bear with round ears and a cream muzzle";
/**
 * Cadrage du doudou neutre sur les planches : il sera remplacé à chaque livre par le doudou
 * de l'enfant, qui peut être n'importe quel animal (girafe, éléphant…). Par-dessus l'épaule
 * ou dans le dos, la retouche n'arrive pas à changer sa silhouette (couverture d'Inès).
 */
const CADRAGE_DOUDOU =
  "PLUSH TOY FRAMING: the plush toy is held in the child's arms or placed right next to the child, seen from the front or three-quarter, " +
  "never over the shoulder and never behind the back; leave a little free space above its head, so a cuddly toy with a longer neck or longer ears would still fit.";
const ENFANT = "the child";

export function persoNeutre(variante: Variante, h?: HistoireMaitresse): Personnalisation {
  return {
    prenom: ENFANT,
    fille: false,
    doudou: "Doudou",
    sonDoudou: "son doudou",
    doudouVisuel: h?.doudouNeutre ?? DOUDOU_NEUTRE,
    parent: variante === "femme" ? "Maman" : "Papa",
    passages: {},
  };
}

export function histoireParId(id: string | undefined): HistoireMaitresse | undefined {
  return HISTOIRES_MAITRESSES.find((h) => h.id === id);
}

export interface ClePlanche {
  cle: string;
  /** L'enfant est vu de dos : la retouche ne change que les cheveux, sans jamais tourner la tête. */
  deDos?: boolean;
  /** -1 : couverture ; sinon index de page (0 = première page). */
  index: number;
  variante: Variante | null;
  enfant: boolean;
  doudou: boolean;
}

const avecParent = (t: string) => t.includes("{parent}") || t.includes("{dit_parent}") || t.includes("{petit_parent}");
const avecEnfant = (t: string) => t.includes("{prenom}") || t.includes("{Il}") || t.includes("{il}");
const avecDoudou = (t: string) => t.includes("{doudou}") || t.includes("{son_doudou}");

/**
 * L'ENFANT est vu de dos (seule sa chevelure sera retouchée). « {parent} (seen
 * from behind) » ne compte pas : c'est le parent qui est de dos, et l'enfant
 * doit alors recevoir son vrai visage. On regarde la seule partie de la scène
 * qui parle de l'enfant.
 */
export function enfantDeDos(scene: string): boolean {
  return scene
    .split(/[;.]/)
    // « never a back view » est une interdiction, pas une description : on l'efface avant de chercher.
    .map((partie) => partie.replace(/\bnever\b[^,;()]*/gi, ""))
    .some((partie) => avecEnfant(partie) && !avecParent(partie) && /from behind|back view|seen from the back/i.test(partie));
}

/** Toutes les planches d'une histoire (couverture, pages, variantes du parent). */
export function clesPlanches(h: HistoireMaitresse): ClePlanche[] {
  const sources = [{ index: -1, scene: h.couverture }, ...h.pages.map((p, i) => ({ index: i, scene: p.scene }))];
  return sources.flatMap(({ index, scene }): ClePlanche[] => {
    const base = index === -1 ? "couverture" : `p${index + 1}`;
    const commun = { index, enfant: avecEnfant(scene), doudou: avecDoudou(scene), deDos: enfantDeDos(scene) };
    return avecParent(scene)
      ? (["homme", "femme"] as const).map((v) => ({ ...commun, cle: `${base}:${v}`, variante: v }))
      : [{ ...commun, cle: base, variante: null }];
  });
}

/** Les personnages du conte présents sur une planche (à garder tels quels lors de la retouche). */
export function autresPersonnages(h: HistoireMaitresse, index: number): { nom: string; description: string }[] {
  const noms = index >= 0 ? h.pages[index]?.presents ?? [] : h.cast.filter((c) => h.couverture.includes(c.nom)).map((c) => c.nom);
  return h.cast.filter((c) => noms.includes(c.nom)).map((c) => ({ nom: c.nom, description: signature(c.visuel) }));
}

/** Le doudou dessiné sur les planches de cette histoire. */
export const doudouDesPlanches = (h: HistoireMaitresse) => h.doudouNeutre ?? DOUDOU_NEUTRE;

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
    // L'enfant vu de dos sur CETTE image (sinon : d'après la scène écrite). Permet d'échanger une planche sans redéployer.
    .then(() => prisma.$executeRawUnsafe(`ALTER TABLE "Planche" ADD COLUMN IF NOT EXISTS "deDos" BOOLEAN`))
    // L'avis de l'agent de vérification : "" = rien à signaler, sinon les défauts vus ; NULL = pas encore vérifiée.
    .then(() => prisma.$executeRawUnsafe(`ALTER TABLE "Planche" ADD COLUMN IF NOT EXISTS verdict TEXT`))
    .catch((e) => {
      pret = null;
      throw e;
    });
  return pret;
}

export interface LignePlanche {
  url: string;
  valide: boolean;
  /** null : on suit la scène écrite. */
  deDos: boolean | null;
  /** Avis de l'agent : "" rien à signaler, sinon les défauts ; null = pas vérifiée. */
  verdict: string | null;
}

export async function lirePlanches(histoire: string, style: string): Promise<Map<string, LignePlanche>> {
  try {
    await table();
    const rows = await prisma.$queryRaw<{ cle: string; url: string; valide: boolean; deDos: boolean | null; verdict: string | null }[]>`
      SELECT cle, url, valide, "deDos", verdict FROM "Planche" WHERE histoire = ${histoire} AND style = ${style}`;
    return new Map(rows.map((r) => [r.cle, { url: r.url, valide: r.valide, deDos: r.deDos, verdict: r.verdict }]));
  } catch {
    return new Map();
  }
}

export async function enregistrer(histoire: string, style: string, cle: string, url: string): Promise<void> {
  await table();
  await prisma.$executeRaw`
    INSERT INTO "Planche" (histoire, style, cle, url, valide) VALUES (${histoire}, ${style}, ${cle}, ${url}, FALSE)
    ON CONFLICT (histoire, style, cle) DO UPDATE SET url = EXCLUDED.url, valide = FALSE, verdict = NULL, "creeLe" = NOW()`;
}

async function noterVerdict(histoire: string, style: string, cle: string, verdict: string): Promise<void> {
  await prisma.$executeRaw`UPDATE "Planche" SET verdict = ${verdict.slice(0, 600)} WHERE histoire = ${histoire} AND style = ${style} AND cle = ${cle}`;
}

/**
 * Met une planche candidate (« <clé>:candidat ») en service, en une seule
 * transaction : l'ancienne est gardée sous « <clé>:ancienne », la nouvelle
 * prend sa place déjà validée, avec son sens (de face / de dos). Aucun livre
 * ne retombe sur l'ancien dessin entre les deux.
 */
export async function utiliserCandidate(histoire: string, style: string, cle: string, deDos: boolean): Promise<boolean> {
  await table();
  const [c] = await prisma.$queryRaw<{ url: string }[]>`
    SELECT url FROM "Planche" WHERE histoire = ${histoire} AND style = ${style} AND cle = ${`${cle}:candidat`}`;
  if (!c) return false;
  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO "Planche" (histoire, style, cle, url, valide, "deDos")
      SELECT histoire, style, ${`${cle}:ancienne`}, url, valide, "deDos" FROM "Planche" WHERE histoire = ${histoire} AND style = ${style} AND cle = ${cle}
      ON CONFLICT (histoire, style, cle) DO UPDATE SET url = EXCLUDED.url, valide = EXCLUDED.valide, "deDos" = EXCLUDED."deDos", "creeLe" = NOW()`,
    prisma.$executeRaw`
      INSERT INTO "Planche" (histoire, style, cle, url, valide, "deDos") VALUES (${histoire}, ${style}, ${cle}, ${c.url}, TRUE, ${deDos})
      ON CONFLICT (histoire, style, cle) DO UPDATE SET url = EXCLUDED.url, valide = TRUE, "deDos" = EXCLUDED."deDos", "creeLe" = NOW()`,
  ]);
  return true;
}

/** Revient à la planche gardée de côté (« <clé>:ancienne »), validée, en une seule transaction. */
export async function revenirAncienne(histoire: string, style: string, cle: string): Promise<boolean> {
  await table();
  const [a] = await prisma.$queryRaw<{ url: string; deDos: boolean | null }[]>`
    SELECT url, "deDos" FROM "Planche" WHERE histoire = ${histoire} AND style = ${style} AND cle = ${`${cle}:ancienne`}`;
  if (!a) return false;
  await prisma.$executeRaw`
    UPDATE "Planche" SET url = ${a.url}, valide = TRUE, "deDos" = ${a.deDos}, "creeLe" = NOW() WHERE histoire = ${histoire} AND style = ${style} AND cle = ${cle}`;
  return true;
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
    planches: cles.map((k) => ({
      ...k,
      url: m.get(k.cle)?.url ?? null,
      valide: Boolean(m.get(k.cle)?.valide),
      // Sens réellement utilisé à la retouche (la planche l'emporte sur la scène écrite).
      deDosEffectif: m.get(k.cle)?.deDos ?? Boolean(k.deDos),
      verdict: m.get(k.cle)?.verdict ?? null,
      candidat: m.has(`${k.cle}:candidat`),
      ancienne: m.has(`${k.cle}:ancienne`),
    })),
  };
}

/* ─── Dessin des planches (une fois par histoire, payant) ─── */

export const enRef = (d: string | null): Ref | null => {
  const m = d ? /^data:([^;]+);base64,(.+)$/.exec(d) : null;
  return m ? { mime: m[1]!, base64: m[2]! } : null;
};
export const lireRef = async (url: string | null | undefined) => enRef(await fetchAsDataUrl(url, { maxPx: 1024, quality: 88 }));

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
    homme: consoliderFiche(construireLivre(h, persoNeutre("homme", h), { style, age: h.ageMin })),
    femme: consoliderFiche(construireLivre(h, persoNeutre("femme", h), { style, age: h.ageMin })),
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
        existantes.set(f.cle, { url: r.imageUrl, valide: true, deDos: null, verdict: null });
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
    const refs = page
      ? presents(page, fiches)
      : [...fiches.entries()]
          .filter(([name]) => (livre.couvertureScene ?? "").toLowerCase().includes(name.toLowerCase()))
          .slice(0, 3)
          .map(([name, f]) => ({ name, ...f }));
    const dessiner = (consigne: string) =>
      generateIllustration({
        ...commun,
        recurringCharacters: livre.personnages,
        scene: k.doudou ? `${consigne} ${CADRAGE_DOUDOU}` : consigne,
        anchorImage: ancre ?? undefined,
        castRefs: refs,
        seed: 91_000 + n + Math.floor(Math.random() * 500),
      });
    let r = await dessiner(scene);
    if (!r.imageUrl) {
      erreurs.push(`${k.cle} : ${r.error ?? "échec"}`);
      return;
    }
    // L'agent regarde la planche ; si elle a un défaut, UN second dessin avec la correction (jamais un troisième).
    let avis = ancre ? await agentPlanche(livre, refs, ancre, r, scene, style) : null;
    if (avis && !avis.ok && Date.now() < limite) {
      const r2 = await dessiner(`${scene}. IMPORTANT CORRECTION: ${avis.fix}`);
      if (r2.imageUrl) {
        r = r2;
        avis = await agentPlanche(livre, refs, ancre!, r, scene, style);
      }
    }
    await enregistrer(h.id, style, k.cle, r.imageUrl!);
    if (avis) await noterVerdict(h.id, style, k.cle, avis.ok ? "" : avis.fix || "défaut non précisé");
    dessinees++;
  });
  return { dessinees, erreurs };
}

/* ─── L'agent de vérification des planches ─── */

/**
 * Regarde une planche comme un directeur artistique (même relectrice que les
 * livres : inventaire de ce qu'elle voit, règles appliquées par le code) :
 * personnages présents et à la bonne taille, une seule peluche, règles de la
 * scène (jamais un chemin pavé…), pas de lettres. Une aide : la validation
 * reste humaine.
 */
async function agentPlanche(
  livre: Story,
  refs: { name: string; base64: string; mime: string }[],
  ancre: Ref,
  image: { base64?: string; mime?: string; imageUrl: string | null },
  scene: string,
  style: string,
): Promise<{ ok: boolean; fix: string } | null> {
  const page = image.base64 ? { base64: image.base64, mime: image.mime ?? "image/jpeg" } : await lireRef(image.imageUrl);
  if (!page) return null;
  const visuels = new Map((livre.cast ?? []).map((c) => [c.nom, c.visuel]));
  const v = await verifier(
    { nom: ENFANT, description: livre.personnages?.split(/\.\s|;/)[0]?.slice(0, 220) ?? "the child", image: ancre },
    refs.map((c) => ({ nom: c.name, description: visuels.get(c.name) ?? c.name, image: { base64: c.base64, mime: c.mime } })),
    page,
    scene,
    grillePour(style),
  );
  if ("nonVerifiee" in v && v.nonVerifiee) return null;
  return { ok: v.ok, fix: v.fix };
}

/** Fait vérifier par l'agent les planches dessinées qui n'ont pas encore d'avis (jusqu'à `limite`). */
export async function verifierPlanches(h: HistoireMaitresse, style: IllustrationStyle, limite: number, toutes = false): Promise<number> {
  const m = await lirePlanches(h.id, style);
  const ancre = await lireRef(m.get("fiche:enfant")?.url);
  if (!ancre) return 0;
  const livres = {
    homme: consoliderFiche(construireLivre(h, persoNeutre("homme", h), { style, age: h.ageMin })),
    femme: consoliderFiche(construireLivre(h, persoNeutre("femme", h), { style, age: h.ageMin })),
  };
  const fiches = new Map<string, Ref>();
  for (const c of livres.homme.cast ?? []) {
    const r = await lireRef(m.get(`fiche:${c.nom}`)?.url);
    if (r) fiches.set(c.nom, r);
  }
  let n = 0;
  const cibles = clesPlanches(h).filter((k) => m.has(k.cle) && (toutes || m.get(k.cle)!.verdict === null));
  await mapLimit(cibles, 4, async (k) => {
    if (Date.now() > limite) return;
    const livre = livres[k.variante ?? "homme"];
    const page = k.index >= 0 ? livre.pages[k.index] : null;
    const scene = page ? page.scene_illustration : `Book cover: ${livre.couvertureScene ?? ""}`;
    const refs = page
      ? presents(page, fiches)
      : [...fiches.entries()].filter(([name]) => (livre.couvertureScene ?? "").toLowerCase().includes(name.toLowerCase())).slice(0, 3).map(([name, f]) => ({ name, ...f }));
    const avis = await agentPlanche(livre, refs, ancre, { imageUrl: m.get(k.cle)!.url }, scene, style);
    if (!avis) return;
    await noterVerdict(h.id, style, k.cle, avis.ok ? "" : avis.fix || "défaut non précisé");
    n++;
  });
  return n;
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
      visage: k.enfant && portrait ? portrait : undefined,
      // La vraie photo du parent (jamais enregistrée) : le visage et les cheveux viennent d'elle.
      photo: k.enfant && req.photo ? req.photo : undefined,
      deDos: planche.deDos ?? k.deDos,
      doudou: k.doudou && doudouRef ? doudouRef : undefined,
      garder: autresPersonnages(h, i).map((c) => `${c.nom} (${c.description})`),
      doudouAvant: doudouDesPlanches(h),
      apparence: story.planches?.apparence ?? req.appearance,
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
    planches: { ...story.planches, retouchees: [...retouchees], apparence: story.planches.apparence ?? req.appearance?.slice(0, 400) },
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
  const r = await retoucherPlanche({
    planche: ref,
    heros: k.enfant ? heros : undefined,
    deDos: planche.deDos ?? k.deDos,
    doudou: k.doudou && dd ? dd : undefined,
    garder: autresPersonnages(h, index).map((c) => `${c.nom} (${c.description})`),
    doudouAvant: doudouDesPlanches(h),
    apparence: story.planches?.apparence,
    seed: Date.now() % 1_000_000,
  });
  return r.imageUrl;
}

/* ─── Relecture des retouches : deux questions seulement ─── */

interface Inspection {
  hair_page?: string;
  hair_length_page?: string;
  plush_animal?: string;
  plush_count?: number;
  present?: Record<string, boolean>;
  head_twisted?: boolean;
  hair_reference?: string;
  hair_length_reference?: string;
  hair_texture_page?: string;
  hair_texture_reference?: string;
  skin_page?: string;
  skin_reference?: string;
  /** Même scène que la planche d'origine (décor, poses, cadrage) : sinon la retouche a renvoyé autre chose. */
  same_scene?: boolean;
  /** Cadre, bordure ou vignette arrondie autour de l'image. */
  frame?: boolean;
}

async function inspecter(
  heros: Ref,
  doudou: Ref | null,
  page: Ref,
  attendus: { nom: string; description: string }[],
  origine: Ref | null = null,
): Promise<Inspection | null> {
  const images = [page, heros, ...(doudou ? [doudou] : []), ...(origine ? [origine] : [])].map((r) => `data:${r.mime};base64,${r.base64}`);
  const prompt = [
    "Image 1 is a book page. Answer in JSON only.",
    '"hair_page": FIRST, looking only at image 1, the hair color of the big child, one word among: blond, light brown, chestnut, dark brown, black, red, grey (lit parts, not shadows); "hair_length_page": short, medium (chin to shoulders) or long (below the shoulders).',
    '"plush_animal": looking only at image 1, the animal the plush toy ACTUALLY looks like (ears, muzzle, tail), "" if there is no plush toy; "plush_count": how many plush toys in image 1.',
    attendus.length
      ? `"present": for each of these characters, true if it is clearly visible in image 1, false otherwise: ${attendus.map((c) => `"${c.nom}" (${c.description})`).join(", ")}.`
      : '"present": {}.',
    `"head_twisted": true if the big child's head faces a different way than the body (for example the face looks at us while the back, the heels or the walking legs show the child is seen from behind), false otherwise.`,
    '"hair_reference" and "hair_length_reference": then, the same two answers for the child in image 2.',
    '"hair_texture_page" and "hair_texture_reference": the hair texture of the big child in image 1, then of the child in image 2, each one word among: straight, wavy, curly, coily.',
    '"skin_page" and "skin_reference": the skin tone of the big child in image 1, then of the child in image 2, each among: very light, light, medium, tan, brown, dark (judge the lit skin, not the colored light of the scene).',
    '"frame": true if image 1 has a border, a frame, a margin or a rounded vignette around the picture instead of filling the whole image, false otherwise.',
    origine
      ? `"same_scene": the LAST image (image ${images.length}) is the original page before the child was retouched. true if image 1 shows the same scene (same setting, same poses, same framing, same other characters; only the child's face, hair or clothes and the plush toy may differ), false if image 1 shows a different scene, pose or framing (for example the child standing alone like a character sheet).`
      : '"same_scene": true.',
    'JSON: {"hair_page": "", "hair_length_page": "", "plush_animal": "", "plush_count": 0, "present": {}, "head_twisted": false, "hair_reference": "", "hair_length_reference": "", "hair_texture_page": "", "hair_texture_reference": "", "skin_page": "", "skin_reference": "", "frame": false, "same_scene": true}',
  ].join("\n");
  try {
    const r = await falFetch(
      "https://fal.run/openrouter/router/vision",
      {
        method: "POST",
        headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
        // Deux questions simples : un modèle sans réflexion suffit (quelques dixièmes de centime).
        body: JSON.stringify({ model: process.env.QA_RETOUCHE_MODEL || "anthropic/claude-sonnet-4.5", prompt, image_urls: images, max_tokens: 450, temperature: 0 }),
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
 * Contrôle des pages retouchées : cheveux (couleur, longueur), animal du doudou
 * (un seul), et les personnages du conte toujours là (Poucet remplacé par le doudou).
 * Une seule reprise par page fautive ; ensuite, le bouton « redessiner » du parent.
 */
export async function controlerRetouches(
  story: Story,
  limite: number,
  visage: Ref | null = null,
  photo: Ref | null = null,
): Promise<{ story: Story; bilan: string }> {
  const retouchees = story.planches?.retouchees ?? [];
  const heros = await lireRef(story.fiches?.heros);
  if (!heros || !retouchees.length) return { story, bilan: "contrôle : rien à vérifier" };
  const doudou = (story.cast ?? []).find((c) => estPeluche(c.visuel));
  const doudouRef = doudou ? await lireRef(story.fiches?.cast?.[doudou.nom]) : null;
  const espece = doudou ? especeAttendue(doudou.visuel) : null;
  const h = histoireParId(story.planches?.histoire);
  const m0 = h ? await lirePlanches(h.id, story.style ?? "anim3d") : new Map<string, LignePlanche>();

  let refaites = 0;
  const nouvelles = new Map<number, string>();
  // Pages où le doudou reste d'une espèce structurellement différente de l'ours neutre de la planche
  // (girafe, éléphant…) : la retouche ne sait pas re-sculpter une telle silhouette. Après ce 2e essai,
  // la page part en relecture humaine (file « Illustrations à relire ») plutôt que d'être envoyée fausse.
  const aRevoir = new Map<number, string>();
  await mapLimit(retouchees, 4, async (i) => {
    if (Date.now() > limite) return;
    const url = i === -1 ? story.couvertureUrl : story.pages[i]?.imageUrl;
    const page = await lireRef(url);
    if (!page) return;
    const attendus = h ? autresPersonnages(h, i) : [];
    const k = h && story.planches ? clePour(h, i, story.planches.variante) : undefined;
    const ligne = k ? m0.get(k.cle) : undefined;
    const planche = await lireRef(ligne?.url);
    // La planche d'origine est montrée aussi : la retouche doit garder SA scène (pas la fiche de l'enfant debout).
    const v = await inspecter(heros, doudouRef, page, attendus, planche ?? null);
    if (!v) return;
    const nomPage = i === -1 ? "couverture" : `p${i + 1}`;
    /** Ce que l'agent reproche à une page (la première fois, puis après la reprise). */
    const releverFautes = (v: Inspection): string[] => {
    const fautes: string[] = [];
    // Ressemblance : des boucles devenues raides ou un teint nettement différent, ce n'est plus cet enfant.
    if (k?.enfant && texturesDifferentes(v.hair_texture_reference, v.hair_texture_page)) fautes.push(`the child's hair must be ${v.hair_texture_reference} like on the reference, not ${v.hair_texture_page}`);
    if (k?.enfant && !(ligne?.deDos ?? k.deDos) && teintsDifferents(v.skin_reference, v.skin_page)) fautes.push(`the child's skin tone must be ${v.skin_reference} like on the reference, not ${v.skin_page}`);
    if (v.same_scene === false) fautes.push("keep EXACTLY the scene of the original page: same setting, same poses, same framing, same other characters; only the child (and the plush toy) change");
    if (v.frame === true) fautes.push("full-bleed picture filling the whole image: no border, no frame, no rounded vignette");
    if (k && !k.doudou && typeof v.plush_count === "number" && v.plush_count > 0) fautes.push("no plush toy at all in this picture");
    if (k?.enfant && cheveuxDifferents(v.hair_reference, v.hair_page)) fautes.push(`the child's hair must be ${v.hair_reference}, not ${v.hair_page}`);
    const court = (t?: string) => /short/i.test(t ?? "");
    const long = (t?: string) => /long/i.test(t ?? "");
    if (k?.enfant && ((court(v.hair_length_page) && long(v.hair_length_reference)) || (long(v.hair_length_page) && court(v.hair_length_reference)))) {
      fautes.push(`the child's hair must be ${v.hair_length_reference} like on the reference, not ${v.hair_length_page}`);
    }
    if (k?.doudou && espece && v.plush_animal && !memeEspece(espece, v.plush_animal)) fautes.push(`the plush toy must be a ${espece}, not a ${v.plush_animal}`);
    if (typeof v.plush_count === "number" && v.plush_count > 1) fautes.push("only ONE plush toy, the child's");
    if (k?.enfant && v.head_twisted === true) {
      fautes.push((m0.get(k.cle)?.deDos ?? k.deDos) ? "the child is seen from behind: keep the head turned away exactly like the body, show only the back of the hair, no face" : "the child's head must face the same way as the body, never twisted");
    }
    for (const c of attendus) if (v.present?.[c.nom] === false) fautes.push(`${c.nom} (${c.description}) must stay exactly as on the original page, never replaced by the plush toy`);
      return fautes;
    };
    const fautes = releverFautes(v);
    if (!fautes.length || !h || !k) return;
    const deDos = ligne?.deDos ?? k.deDos;
    if (!planche) return;
    const r = await retoucherPlanche({
      planche,
      heros: k.enfant ? heros : undefined,
      visage: k.enfant && visage ? visage : undefined,
      photo: k.enfant && photo ? photo : undefined,
      deDos,
      doudou: k.doudou && doudouRef ? doudouRef : undefined,
      correction: fautes.join("; "),
      garder: autresPersonnages(h, i).map((c) => `${c.nom} (${c.description})`),
      doudouAvant: doudouDesPlanches(h),
      apparence: story.planches?.apparence,
      seed: 9_000 + i * 41 + (Date.now() % 997),
    });
    if (!r.imageUrl) {
      // La reprise a échoué : la page fautive ne part pas telle quelle.
      aRevoir.set(i, `${nomPage} : ${fautes.join(" ; ")}`.slice(0, 300));
      return;
    }
    nouvelles.set(i, r.imageUrl);
    refaites++;
    // Garde-fou final : la page refaite est vérifiée à son tour. Encore fautive, le livre attend dans l'atelier.
    const refaite = r.base64 ? { base64: r.base64, mime: r.mime ?? "image/jpeg" } : await lireRef(r.imageUrl);
    const v2 = refaite ? await inspecter(heros, doudouRef, refaite, attendus, planche) : null;
    const restantes = v2 ? releverFautes(v2) : [];
    if (restantes.length) aRevoir.set(i, `${nomPage} : ${restantes.join(" ; ")}`.slice(0, 300));
  });
  return {
    story: {
      ...story,
      couvertureUrl: nouvelles.get(-1) ?? story.couvertureUrl,
      pages: story.pages.map((p, i) => (nouvelles.has(i) ? { ...p, imageUrl: nouvelles.get(i)! } : p)),
      controleImages: { verifiees: retouchees.length, refaites, nonVerifiees: 0 },
      imagesARevoir: aRevoir.size ? [...aRevoir.keys()] : undefined,
    },
    bilan:
      `contrôle des retouches : ${retouchees.length} vérifiées, ${refaites} refaites` +
      (aRevoir.size ? ` — à revoir avant envoi : ${[...aRevoir.values()].join(" ; ")}` : ""),
  };
}

/* ─── Boucle d'amélioration : les pages que les parents font redessiner ─── */

let pretRefaites: Promise<unknown> | null = null;
function tableRefaites(): Promise<unknown> {
  pretRefaites ??= prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "PageRefaite" (id SERIAL PRIMARY KEY, "bookId" TEXT NOT NULL, histoire TEXT, style TEXT, page INT NOT NULL, cle TEXT, "creeLe" TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
    )
    .catch((e) => {
      pretRefaites = null;
      throw e;
    });
  return pretRefaites;
}

/** Un parent a fait redessiner une page (-1 : la couverture). Jamais bloquant. */
export async function noterPageRefaite(bookId: string, story: Story, index: number): Promise<void> {
  try {
    await tableRefaites();
    const h = histoireParId(story.planches?.histoire ?? story.meta?.trame);
    const cle = h && story.planches ? clePour(h, index, story.planches.variante)?.cle ?? null : null;
    await prisma.$executeRaw`
      INSERT INTO "PageRefaite" ("bookId", histoire, style, page, cle) VALUES (${bookId}, ${h?.id ?? null}, ${story.style ?? null}, ${index}, ${cle})`;
  } catch (e) {
    console.error("[planches] page refaite non notée :", String(e).slice(0, 120));
  }
}

/** Pour l'atelier : combien de livres de cette histoire, et combien de fois chaque planche a été refaite. */
export async function statsRefaites(histoire: string, style: string): Promise<{ livres: number; parCle: Map<string, number> }> {
  try {
    await tableRefaites();
    const [l] = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*)::bigint AS n FROM "Book" WHERE "deletedAt" IS NULL AND pages->'planches'->>'histoire' = ${histoire} AND pages->>'style' = ${style}`;
    const rows = await prisma.$queryRaw<{ cle: string; n: bigint }[]>`
      SELECT cle, COUNT(DISTINCT "bookId")::bigint AS n FROM "PageRefaite" WHERE histoire = ${histoire} AND style = ${style} AND cle IS NOT NULL GROUP BY cle`;
    return { livres: Number(l?.n ?? 0), parCle: new Map(rows.map((r) => [r.cle, Number(r.n)])) };
  } catch {
    return { livres: 0, parCle: new Map() };
  }
}

/** Les derniers livres faits avec les planches d'une histoire (vérifications de l'atelier). */
export async function derniersLivres(histoire: string, heures = 48): Promise<{ id: string; creeLe: Date; status: string }[]> {
  try {
    return await prisma.$queryRaw<{ id: string; creeLe: Date; status: string }[]>`
      SELECT id, "createdAt" AS "creeLe", status::text AS status FROM "Book"
      WHERE "deletedAt" IS NULL AND pages->'planches'->>'histoire' = ${histoire} AND "createdAt" > NOW() - make_interval(hours => ${heures})
      ORDER BY "createdAt" DESC LIMIT 20`;
  } catch {
    return [];
  }
}
