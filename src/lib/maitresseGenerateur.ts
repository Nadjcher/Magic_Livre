/**
 * Fabrique le livre d'un enfant à partir d'une histoire maîtresse : texte fixe
 * (relu et validé), marqueurs remplacés, et seulement les passages prévus
 * personnalisés par un petit appel à l'IA (repli : le texte par défaut).
 */

import "server-only";
import { env } from "./env";
import { noterDepense, PRIX_ESTIMES } from "./budget";
import type { Story } from "./storySchema";
import type { StoryRequest } from "./storyPrompt";
import { passageValide, possessif, remplir, type HistoireMaitresse, type Personnalisation } from "./histoiresMaitresses";
import { checkUserText } from "./validation";
import { falFetch } from "./jetonsFal";

interface Lecture {
  fille?: boolean;
  doudou?: { nom?: string; son?: string; visuel?: string };
  passages?: Record<string, string>;
}

/** Un seul appel : lire le doudou, deviner le genre si besoin, écrire les passages prévus. */
async function lirePersonnalisation(h: HistoireMaitresse, req: StoryRequest, doudouSaisi: string): Promise<Lecture> {
  if (!env.falApiKey()) return {};
  const f = req.fiche;
  const consignes = Object.entries(h.passages)
    .map(([cle, p]) => `- "${cle}" : ${p.consigne} ${p.motsMax} mots au plus. Exemple (texte par défaut) : « ${p.defaut} »`)
    .join("\n");
  const prompt = [
    `Enfant : ${req.childFirstName}, ${req.childAge} ans.${req.genre ? ` C'est ${req.genre === "fille" ? "une fille" : "un garçon"}.` : ""}`,
    `Doudou (saisi par le parent) : ${doudouSaisi || "(rien)"}`,
    f?.aime ? `Ce que l'enfant aime : ${f.aime}` : "",
    f?.objet ? `Objet fétiche : ${f.objet}` : "",
    "",
    "Tâches :",
    req.genre ? "" : "1. \"fille\" : true si le prénom est le plus souvent féminin, false sinon.",
    "2. \"doudou\" : \"nom\" (son nom propre SEULEMENT s'il est donné par le parent, sinon \"\"), \"son\" (« son lapin », « sa girafe », « son ours », « son doudou »…), \"visuel\" (description EN ANGLAIS pour l'illustrateur : espèce, couleur, matière, signes distinctifs, en 25 mots max ; « a soft plush … »).",
    "3. \"passages\" : écris chaque passage ci-dessous en français, pour une lecture à voix haute à un enfant, dans le ton de l'histoire. Utilise un VRAI détail de l'enfant (ce qu'il aime, son doudou), mais JAMAIS de marque, de personnage connu, de dessin animé, de film ni de jeu vidéo : si l'enfant aime « Spider-Man » ou « la Pat' Patrouille », parle plutôt d'araignées ou de chiots pompiers. Pas de majuscule (sauf en début), pas de guillemets, pas de chiffres, une seule phrase.",
    consignes,
    "",
    'Réponds UNIQUEMENT en JSON : {"fille": true, "doudou": {"nom": "", "son": "", "visuel": ""}, "passages": {"cle": "texte"}}',
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const r = await falFetch("https://fal.run/openrouter/router", {
      method: "POST",
      headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.STORY_CRITIC_MODEL || "anthropic/claude-sonnet-5.5",
        system_prompt: "Tu es éditeur jeunesse. Tu personnalises une histoire déjà écrite, sans jamais en changer le reste.",
        prompt,
        reasoning: true,
        max_tokens: 4000,
      }),
    }, 70_000);
    const j = (await r.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
    if (r.ok) await noterDepense(j.usage?.cost ?? PRIX_ESTIMES.relecture);
    const json = /\{[\s\S]*\}/.exec(j.output ?? "")?.[0];
    return json ? (JSON.parse(json) as Lecture) : {};
  } catch (e) {
    console.error("[maîtresse] personnalisation indisponible :", String(e).slice(0, 160));
    return {};
  }
}

const propre = (t: unknown, max: number) => (typeof t === "string" ? t.replace(/[«»"{}[\]]/g, "").trim().slice(0, max) : "");

/** Le livre de l'enfant, prêt à illustrer. */
export async function histoireDepuisMaitresse(h: HistoireMaitresse, req: StoryRequest): Promise<Story> {
  const doudouExtra = req.extras?.find((e) => e.role === "doudou");
  const doudouSaisi = [doudouExtra ? `${doudouExtra.name}${doudouExtra.appearance ? ` (${doudouExtra.appearance})` : ""}` : "", req.fiche?.objet ?? ""]
    .filter(Boolean)
    .join(" ; ");
  const lu = await lirePersonnalisation(h, req, doudouSaisi);

  // Doudou : son nom s'il en a un, sinon « son lapin » ; « son doudou » si le parent n'en a pas parlé.
  const nomDoudou = propre(doudouExtra?.name, 30) || propre(lu.doudou?.nom, 30);
  const son = doudouSaisi ? possessif(propre(lu.doudou?.son, 30) || "son doudou") : "son doudou";
  const visuel =
    propre(lu.doudou?.visuel, 220) || (doudouSaisi ? `a soft plush toy: ${doudouSaisi}` : "a soft light-brown plush teddy bear with round ears, a cream muzzle and small black eyes");
  // Un seul lecteur dans l'histoire (le texte est au singulier) : Papa, sinon Maman, Mamie, Papi.
  const roles = (req.extras ?? []).map((e) => e.role);
  const parent: Personnalisation["parent"] = roles.includes("papa")
    ? "Papa"
    : roles.includes("maman")
      ? "Maman"
      : roles.includes("mamie")
        ? "Mamie"
        : roles.includes("papi")
          ? "Papi"
          : "Papa";

  const passages: Record<string, string> = {};
  for (const cle of Object.keys(h.passages)) {
    const propose = lu.passages?.[cle];
    // Repli sur le texte relu si le passage déborde, cite une marque ou un personnage protégé.
    if (typeof propose === "string" && passageValide(cle, propose, h) && checkUserText(propose).ok) {
      const t = propose.trim();
      // Le passage reprend la ponctuation de son texte par défaut (phrase complète ou morceau de phrase).
      passages[cle] = /[.!?…]$/.test(h.passages[cle]!.defaut) ? (/[.!?…]$/.test(t) ? t : `${t}.`) : t.replace(/[.!?…]+$/, "");
    }
  }

  const p: Personnalisation = {
    prenom: req.childFirstName,
    fille: req.genre ? req.genre === "fille" : Boolean(lu.fille),
    doudou: nomDoudou,
    sonDoudou: son,
    doudouVisuel: visuel,
    parent,
    passages,
  };

  const nomFiche = p.doudou || "Doudou";
  const fiche = `${nomFiche} (the child's cuddly toy, never alive): ${visuel}`;
  const personnages = [
    `${p.prenom} (hero): ${h.tenueHeros} — same outfit on every page.`,
    fiche,
    ...h.cast.map((c) => `${c.nom}: ${c.visuel}`),
    `${p.parent}: an ADULT ${p.parent === "Maman" || p.parent === "Mamie" ? "woman" : "man"}${p.parent === "Mamie" || p.parent === "Papi" ? " with grey hair" : ""}, twice the hero's height, in a dark green knitted sweater and beige trousers (never pyjamas, never dressed like the hero); only a hand, a silhouette from behind or a profile in shadow, never a detailed face.`,
  ].join(" ");
  // Dans les consignes d'image (en anglais), le doudou garde un nom (« Doudou » s'il n'en a pas).
  const pImage = { ...p, doudou: nomFiche };
  const scene = (t: string) => remplir(t, pImage, h);

  return {
    titre: remplir(h.titre, p, h),
    pages: h.pages.map((pg) => ({
      texte: remplir(pg.texte, p, h),
      scene_illustration: scene(pg.scene),
      // Le doudou est fourni au dessinateur sur toutes les pages où il apparaît (sinon : un chien à sa place).
      presents: (() => {
        const scene = remplir(pg.scene, pImage, h);
        const liste = (pg.presents ?? []).map((x) => remplir(x, pImage, h));
        if (pg.presents && scene.includes(nomFiche) && !liste.includes(nomFiche)) liste.push(nomFiche);
        return pg.presents ? liste : undefined;
      })(),
    })),
    personnages,
    cast: [{ nom: nomFiche, visuel: `PLUSH TOY, never alive: ${visuel}`.slice(0, 400) }, ...h.cast],
    resume: remplir(h.resume, p, h),
    faits: remplir(h.faits, p, h),
    plan: { ritournelle: h.ritournelle, objet_cle: `${p.sonDoudou}${p.doudou ? ` ${p.doudou}` : ""}` },
    style: req.style,
    meta: { age: req.childAge, format: "album", themeId: h.themeId, mode: "theme", trame: h.id, modeles: [h.id] },
    couvertureScene: remplir(h.couverture, pImage, h),
  };
}
