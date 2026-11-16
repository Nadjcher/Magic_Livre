/**
 * Contrôle qualité des illustrations, comme un directeur artistique :
 * chaque page (et la couverture) est comparée aux fiches des personnages par
 * un modèle de vision, qui fait l'inventaire de ce qu'il voit (personnages,
 * espèces, tailles, nombre de peluches…) ; le code applique les règles
 * (jugerInventaire). Une page fautive est redessinée (2 essais) avec les
 * corrections précises, puis en scène simplifiée en dernier recours.
 *
 * Tout est borné dans le temps et « best-effort » : en cas de souci, le livre
 * garde ses illustrations d'origine.
 */

import "server-only";
import { env } from "./env";
import { PRIX_ESTIMES, noterDepense } from "./budget";
import { estCarre, grillePour } from "./bibleVisuelle";
import { mapLimit } from "./parallele";
import { fetchAsDataUrl } from "./imageFetch";
import { generateIllustration } from "./illustration";
import type { Story } from "./storySchema";
import type { StoryRequest } from "./storyPrompt";
import { falFetch } from "./jetonsFal";

type Ref = { base64: string; mime: string };

const SYSTEME =
  "You are the strict art director of a children's picture book. You compare a page illustration with the " +
  "character reference sheets and report only clear, visible errors. Answer ONLY with JSON.";

function modele(): string {
  // Gemini Flash : ~0,05 centime par contrôle (15× moins cher que Sonnet) ;
  // il a repéré les mêmes erreurs sur notre jeu de test.
  // Claude Sonnet : Gemini Flash validait des images fautives (test du 11 nov.).
  // Claude Sonnet 5.5 (avec réflexion) : a vu le doudou devenu chien que Sonnet 4.5 laissait passer (16 nov.).
  return process.env.QA_VISION_MODEL || "anthropic/claude-sonnet-5.5";
}

export function controleActif(): boolean {
  return Boolean(env.falApiKey()) && process.env.QA_ILLUSTRATIONS !== "off";
}

function enRef(dataUrl: string | null): Ref | null {
  const m = dataUrl ? /^data:([^;]+);base64,(.+)$/.exec(dataUrl) : null;
  return m ? { mime: m[1] as string, base64: m[2] as string } : null;
}

const petit = { maxPx: 768, quality: 80 };

/** Ce que la relectrice dit VOIR (inventaire), le code décide ensuite. */
interface Inventaire {
  hero?: { count?: number; pose?: string; hair_reference?: string; hair_seen?: string; hair_same_color_as_reference?: boolean; face_and_outfit_match_reference?: boolean };
  characters?: {
    name?: string;
    count?: number;
    species_seen?: string;
    same_design_as_reference?: boolean;
    size?: string;
    top_reaches?: string;
    animal_ears_or_animal_head?: boolean;
  }[];
  page_hair?: string;
  heights?: { who?: string; fraction?: number }[];
  plush_toys?: { animal?: string; color?: string }[];
  plush_toys_count?: number;
  other_humans?: { adult_or_child?: string; dressed_like_hero?: boolean }[];
  parent_is_adult?: boolean | null;
  explicit_rule_violations?: string[];
  contradictions_with_scene?: string[];
  unexpected_characters?: string[];
  letters_or_text?: boolean;
  blank_unpainted_area?: boolean;
  style_consistent?: boolean;
  frightening?: boolean;
}

export const estPeluche = (d: string) => /plush|cuddly toy|never alive|soft toy/i.test(d);
const estMinuscule = (d: string) => /\btiny\b|toy-figurine|figurine|teacup|egg cup|25 cm/i.test(d);
const estHumain = (d: string) => /^(human|tiny elf|elf)\b|\bboy\b|\bgirl\b|\belf\b/i.test(d.trim()) && !estPeluche(d);
/** Espèce attendue d'une peluche (« rabbit », « bear »…), lue dans sa fiche. */
export function especeAttendue(d: string): string | null {
  const m = /\b(rabbit|bunny|bear|teddy|dog|puppy|cat|kitten|fox|elephant|giraffe|lion|tiger|monkey|unicorn|dinosaur|dragon|owl|penguin|panda|koala|mouse|sheep|lamb|cow|horse|pony|duck|frog|turtle|pig|deer|raccoon|hedgehog|squirrel|wolf|seal|whale|dolphin|octopus|bird|chick)\b/i.exec(d);
  if (!m) return null;
  const e = m[1]!.toLowerCase();
  return e === "bunny" ? "rabbit" : e === "teddy" ? "bear" : e === "puppy" ? "dog" : e === "kitten" ? "cat" : e === "lamb" ? "sheep" : e;
}
export const memeEspece = (attendue: string, vue: string) => {
  const v = vue.toLowerCase();
  const synonymes: Record<string, string[]> = { rabbit: ["rabbit", "bunny", "hare"], bear: ["bear", "teddy"], dog: ["dog", "puppy"], cat: ["cat", "kitten"], sheep: ["sheep", "lamb"] };
  return (synonymes[attendue] ?? [attendue]).some((x) => v.includes(x));
};

/**
 * Le verdict d'un contrôle : ok, ou la correction à apporter.
 *
 * Avec la grille (styles de la bible visuelle) : la relectrice ne juge pas,
 * elle fait l'INVENTAIRE de ce qu'elle voit (combien de peluches, quelle
 * espèce, quelle taille, oreilles d'animal…) et le code applique les règles.
 * Une IA répond bien mieux à « combien de peluches ? » qu'à « l'image est-elle
 * conforme ? » (jeu d'épreuve : 13/20 avec les questions générales).
 */
export async function verifier(
  heros: { nom: string; description: string; image: Ref },
  cast: { nom: string; description: string; image: Ref }[],
  page: Ref,
  scene: string,
  grille: string[] | null = null,
  /** Modèle de vision imposé (essais de comparaison) ; sinon celui de la configuration. */
  modeleImpose?: string,
): Promise<{ ok: boolean; fix: string; nonVerifiee?: boolean }> {
  const lignes = [`Image 1 is the reference sheet of the hero ${heros.nom} (${heros.description}).`];
  cast.forEach((c, k) => lignes.push(`Image ${k + 2} is the reference sheet of ${c.nom} (${c.description}).`));
  if (grille) {
    const style = grille.find((l) => l.startsWith("The rendering")) ?? "";
    lignes.push(
      `The LAST image is the book page to check. Scene requested: ${scene}`,
      "Do NOT judge whether the picture is good. Only REPORT precisely what you SEE, as JSON, in this order:",
      `- "page_hair": FIRST, before looking at any reference sheet, the hair color of ${heros.nom} on the PAGE, one word among: blond, light brown, chestnut, dark brown, black, red, grey (look at the lit parts of the hair, not the shadows).`,
      `- "heights": also BEFORE the reference sheets, for every character other than ${heros.nom} that is clearly smaller than him, its height as a fraction of ${heros.nom}'s height if both stood on the same ground (e.g. 0.25 = a quarter of his height; ignore what it stands on): [{"who": "short description", "fraction": 0.25}].`,
      '- "plush_toys": also before looking at the reference sheets, list EVERY plush / cuddly toy visible in the page, with the animal it ACTUALLY looks like (judge by its ears, muzzle, tail and shape: a dog has a long muzzle and floppy ears, a bear has small round ears and a short muzzle, a cat has pointed ears and whiskers, a rabbit has long ears) and its color. Do not assume what it should be.',
      `- "other_humans": every person in the page other than ${heros.nom} and other than the tiny characters listed below, with "adult_or_child" (judge by size and body proportions) and "dressed_like_hero" (true if wearing the same pyjamas or outfit as ${heros.nom}). [] if none.`,
      `- "hero": how many times ${heros.nom} appears ("count"); his pose ("pose": "standing", "crouching", "kneeling" or "sitting"); the hair color on the REFERENCE sheet ("hair_reference") and on the PAGE ("hair_seen"), each one word among: blond, light brown, chestnut, dark brown, black, red, grey (look at the lit parts of the hair, not the shadows); whether face and outfit match the reference ("face_and_outfit_match_reference").`,
      `- "characters": for EACH of these characters: ${cast.length ? cast.map((c) => c.nom).join(", ") : "(none)"}: "name", "count" (how many times it appears, 0 if absent), "species_seen" (what it looks like: rabbit, bear, dog, boy, elf…), "same_design_as_reference" (same species, colors and look as its reference sheet), "top_reaches" (where the top of its head or hat reaches on ${heros.nom}'s body as drawn: "below knee", "knee to chest" or "chest or higher"; judge its OWN body height, ignoring what it stands on: imagine it standing on the same ground as ${heros.nom}), "animal_ears_or_animal_head" (true if it has animal ears or an animal head).`,
      '- "explicit_rule_violations": ONLY the rules the scene states explicitly with "never", "no", "not", "only" or "exactly" (e.g. "never a paved path", "Poucet is the only small character") that the picture clearly breaks, quoting the rule; [] if none. Do NOT list differences of pose, action, props or details. Descriptions of characters (in parentheses or after a name, e.g. "never alive") are not rules: a plush toy sitting, propped up or held is NOT alive. A picture INSIDE the picture (an open book, a drawing, a painting) is never checked against the scene rules.',
      '- "unexpected_characters": people or creatures that are neither listed above nor mentioned in the scene; [] if none.',
      '- "letters_or_text", "blank_unpainted_area" (a white or empty unpainted part), "frightening": true or false.',
      `- "style_consistent": ${style || "the whole picture keeps one consistent rendering style"} (true or false).`,
      "Ignore small props (a pencil, a lamp, a cup), small patterns on clothes, and everything shown inside an open book or a picture on the wall.",
      'JSON only, exactly these keys: {"page_hair": "", "heights": [], "plush_toys": [{"animal": "", "color": ""}], "other_humans": [], "hero": {...}, "characters": [...], "explicit_rule_violations": [], "unexpected_characters": [], "letters_or_text": false, "blank_unpainted_area": false, "style_consistent": true, "frightening": false}',
    );
  } else lignes.push(
    `The LAST image is the page illustration to check. Scene requested: ${scene}`,
    "Flag ONLY these serious identity errors: (a) the hero is drawn twice or more; (b) a character is clearly NOT " +
      "the same design as its reference sheet: different species or body type, or clearly different main colors; " +
      "(c) a recurring character is duplicated (two copies), or another character wears the hero's exact outfit. " +
      "Do NOT judge the setting, action, composition, pose, scale, lighting, or small details (a logo, a scarf, an " +
      "accessory). When in doubt, it is ok.",
    'Reply with JSON only: {"ok": true|false, "fix": "if not ok: one short English instruction to correct the drawing, naming the character"}',
  );
  const images = [heros.image, ...cast.map((c) => c.image), page].map((r) => `data:${r.mime};base64,${r.base64}`);
  const modeleChoisi = modeleImpose || modele();
  // Chez fal, ces modèles n'acceptent qu'avec la réflexion activée.
  const reflexion = /claude-(sonnet|opus)-5|gemini-2\.5-pro|gpt-5/i.test(modeleChoisi);
  try {
    const r = await falFetch("https://fal.run/openrouter/router/vision", {
      method: "POST",
      headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modeleChoisi,
        system_prompt: SYSTEME,
        prompt: lignes.join("\n"),
        image_urls: images,
        // L'inventaire complet tient en ~600 jetons ; 400 coupaient la réponse, qui passait alors sans contrôle.
        // Les modèles récents réfléchissent d'abord (obligatoire chez fal) : place pour la réflexion en plus.
        ...(reflexion ? { reasoning: true, max_tokens: 6000 } : { max_tokens: grille ? 1400 : 400, temperature: 0 }),
      }),
    }, grille ? 90_000 : 40_000);
    const j = (await r.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
    if (r.ok) await noterDepense(j.usage?.cost ?? PRIX_ESTIMES.vision);
    const json = /\{[\s\S]*\}/.exec(j.output ?? "")?.[0];
    if (!r.ok || !json) {
      console.error("[contrôle] vision indisponible :", r.status, JSON.stringify(j).slice(0, 160));
      return { ok: true, fix: "", nonVerifiee: true };
    }
    let v: { ok?: unknown; fix?: unknown } & Inventaire;
    try {
      v = JSON.parse(json);
    } catch {
      console.error("[contrôle] réponse illisible :", (j.output ?? "").slice(0, 160));
      return { ok: true, fix: "", nonVerifiee: true };
    }
    if (grille) {
      if (!v.hero && !Array.isArray(v.characters)) return { ok: true, fix: "", nonVerifiee: true };
      const fautes = jugerInventaire(v, heros, cast, scene);
      return { ok: fautes.length === 0, fix: fautes.join(" ").slice(0, 500) };
    }
    return { ok: v.ok !== false, fix: typeof v.fix === "string" ? v.fix.slice(0, 300) : "" };
  } catch {
    return { ok: true, fix: "", nonVerifiee: true }; // contrôle indisponible : on ne bloque jamais le livre, mais on le compte
  }
}

/** Échelle des couleurs de cheveux : deux crans d'écart (blond → châtain) ou roux d'un côté seulement = différent. */
const CHEVEUX = ["blond", "light brown", "chestnut", "dark brown", "black"];
export function cheveuxDifferents(ref?: string, vu?: string): boolean {
  const r = (ref ?? "").toLowerCase().trim();
  const v = (vu ?? "").toLowerCase().trim();
  if (!r || !v) return false;
  if (r.includes("red") !== v.includes("red")) return true;
  const i = CHEVEUX.findIndex((c) => r === c || r.includes(c));
  const j = CHEVEUX.findIndex((c) => v === c || v.includes(c));
  return i >= 0 && j >= 0 && Math.abs(i - j) >= 2;
}

/** Petit personnage trop grand, selon la pose du héros (accroupi : jusqu'à la poitrine). */
function tropGrand(x: { size?: string; top_reaches?: string }, pose?: string): boolean {
  const t = (x.top_reaches ?? "").toLowerCase();
  if (!t) return Boolean(x.size && x.size !== "tiny");
  if (t.includes("chest or higher")) return true;
  const debout = !pose || /stand/i.test(pose);
  return debout && t.includes("knee to chest");
}

/** Les règles, appliquées par le code à l'inventaire (chaque faute devient une correction précise). */
export function jugerInventaire(
  v: Inventaire,
  heros: { nom: string },
  cast: { nom: string; description: string }[],
  scene = "",
): string[] {
  const f: string[] = [];
  const h = v.hero ?? {};
  if ((h.count ?? 1) > 1) f.push(`Draw ${heros.nom} only ONCE.`);
  if ((h.count ?? 1) >= 1) {
    const vue = v.page_hair || h.hair_seen;
    if (h.hair_same_color_as_reference === false || cheveuxDifferents(h.hair_reference, h.hair_seen) || cheveuxDifferents(h.hair_reference, vue)) {
      f.push(`${heros.nom}'s hair color must be exactly as on the reference (${h.hair_reference ?? "reference"}), not ${vue ?? "different"}.`);
    }
    if (h.face_and_outfit_match_reference === false) f.push(`${heros.nom}'s face and outfit must match the reference sheet.`);
  }
  // Peluches : l'inventaire « à l'aveugle » (fait avant de regarder les fiches) fait foi pour l'espèce.
  const peluches = cast.filter((c) => estPeluche(c.description));
  const vuesPeluches = (v.plush_toys ?? []).filter((x) => (x.animal ?? "").trim());
  const nbPeluches = vuesPeluches.length || v.plush_toys_count || 0;
  if (nbPeluches > Math.max(1, peluches.length)) f.push(`Only ONE plush toy in the picture (seen: ${nbPeluches}).`);
  for (const c of peluches) {
    const attendue = especeAttendue(c.description);
    const fausse = attendue ? vuesPeluches.find((x) => !memeEspece(attendue, x.animal ?? "")) : undefined;
    if (attendue && fausse && !vuesPeluches.some((x) => memeEspece(attendue, x.animal ?? ""))) {
      f.push(`The plush toy ${c.nom} must be the plush ${attendue} of its reference sheet, not a ${fausse.animal}.`);
    }
  }
  const vus = v.characters ?? [];
  // Hauteurs mesurées à l'aveugle (fraction de la taille du héros) : un « minuscule » dépasse rarement 0,3.
  const petits = (v.heights ?? []).map((x) => x.fraction).filter((n): n is number => typeof n === "number" && n > 0 && n < 1.5);
  for (const c of cast) {
    const x = vus.find((y) => (y.name ?? "").toLowerCase() === c.nom.toLowerCase());
    const peluche = estPeluche(c.description);
    if (!x || (x.count ?? 0) === 0) {
      f.push(`${c.nom} is missing: draw ${c.nom} exactly as on the reference sheet.`);
      continue;
    }
    if ((x.count ?? 1) > 1) f.push(`${c.nom} appears ${x.count} times: draw ${c.nom} only ONCE.`);
    const attendue = peluche ? especeAttendue(c.description) : null;
    const vue = x.species_seen ?? "";
    if (attendue && vue && !memeEspece(attendue, vue) && !f.some((m) => m.includes(`plush toy ${c.nom}`))) {
      f.push(`The plush toy ${c.nom} must be the plush ${attendue} of its reference sheet, not a ${vue}.`);
    } else if (!peluche && !estHumain(c.description) && x.same_design_as_reference === false) {
      // Les humains et lutins : la relectrice les dit « différents » pour un détail ; on juge leur taille et leurs oreilles.
      f.push(`${c.nom} must look exactly like its reference sheet (seen: ${vue || "a different design"}).`);
    }
    if (estMinuscule(c.description) && (tropGrand(x, h.pose) || (petits.length > 0 && petits.every((p) => p > 0.35)))) {
      f.push(`${c.nom} must be TINY: the top of the head or hat below ${heros.nom}'s knee (size seen: ${x.top_reaches ?? x.size}).`);
    }
    if (estHumain(c.description) && x.animal_ears_or_animal_head === true && !/\belf\b/i.test(c.description)) {
      f.push(`${c.nom} is a human: no animal ears, no animal head.`);
    }
  }
  // Le parent : un adulte, jamais habillé comme l'enfant.
  const parentDemande = /\b(papa|maman|mamie|papi|parent|father|mother|dad|mum|mom|grand(?:ma|pa|mother|father))\b/i.test(scene);
  const autres = v.other_humans ?? [];
  if (v.parent_is_adult === false || (parentDemande && autres.some((x) => /child|kid|boy|girl/i.test(x.adult_or_child ?? "") || x.dressed_like_hero === true))) {
    f.push("The parent must be an ADULT, clearly bigger than the child and never dressed like the child.");
  }
  for (const c of (v.explicit_rule_violations ?? []).slice(0, 3)) if (c?.trim()) f.push(`Follow the scene: ${c.trim()}.`);
  const inattendus = (v.unexpected_characters ?? []).filter((x) => x?.trim());
  if (inattendus.length) f.push(`Remove the characters that are not in the scene: ${inattendus.slice(0, 3).join(", ")}.`);
  if (v.letters_or_text === true) f.push("No letters or text anywhere.");
  if (v.blank_unpainted_area === true) f.push("The picture has a blank, white, unpainted area: paint the whole scene to every edge.");
  if (v.style_consistent === false) f.push("Keep exactly the book's rendering style over the whole picture.");
  if (v.frightening === true) f.push("Nothing frightening.");
  return f;
}

/**
 * Zone vide (contrôle par le code, sans IA) : un bloc d'image presque blanc et
 * uniforme, d'au moins 4 cases de 1/8 d'image qui se touchent (rectangle non
 * peint). La relectrice IA ne le voyait pas.
 */
export async function zoneVide(img: Ref): Promise<boolean> {
  try {
    const { default: sharp } = await import("sharp");
    const N = 64;
    const { data } = await sharp(Buffer.from(img.base64, "base64")).resize(N, N, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const B = 8;
    const t = N / B;
    const vide: boolean[] = [];
    for (let by = 0; by < B; by++)
      for (let bx = 0; bx < B; bx++) {
        const v: number[] = [];
        for (let y = by * t; y < (by + 1) * t; y++) for (let x = bx * t; x < (bx + 1) * t; x++) v.push(data[y * N + x] ?? 0);
        const m = v.reduce((a, b) => a + b, 0) / v.length;
        const ec = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
        vide.push(m > 238 && ec < 4);
      }
    // Plus grand groupe de cases vides voisines.
    const vu = new Set<number>();
    let max = 0;
    for (let k = 0; k < vide.length; k++) {
      if (!vide[k] || vu.has(k)) continue;
      let n = 0;
      const pile = [k];
      vu.add(k);
      while (pile.length) {
        const c = pile.pop()!;
        n++;
        const [cx, cy] = [c % B, Math.floor(c / B)];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const [nx, ny] = [cx + dx, cy + dy];
          const nk = ny * B + nx;
          if (nx >= 0 && ny >= 0 && nx < B && ny < B && vide[nk] && !vu.has(nk)) {
            vu.add(nk);
            pile.push(nk);
          }
        }
      }
      max = Math.max(max, n);
    }
    return max >= 4;
  } catch {
    return false;
  }
}

/** Attend une promesse au plus jusqu'à `limite` (horodatage) ; sinon null. */
function avant<T>(limite: number, p: Promise<T>): Promise<T | null> {
  const reste = limite - Date.now();
  if (reste <= 0) return Promise.resolve(null);
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), reste))]);
}

/**
 * Contrôle toutes les illustrations et redessine les fautives. `limite` :
 * horodatage au-delà duquel on n'attend plus rien (le livre doit être prêt).
 */
export async function controlerIllustrations(
  story: Story,
  req: StoryRequest,
  limite: number,
): Promise<{ story: Story; bilan: string }> {
  // Livre fait à partir des planches validées : seules les retouches sont vérifiées (cheveux, doudou).
  if (story.planches?.retouchees?.length) {
    const { controlerRetouches } = await import("./planches");
    return controlerRetouches(story, limite);
  }
  const heroImg = enRef(await fetchAsDataUrl(story.fiches?.heros, petit));
  if (!heroImg) return { story, bilan: "contrôle impossible (pas de fiche du héros)" };

  const castVisuel = new Map((story.cast ?? []).map((c) => [c.nom.toLowerCase(), c.visuel]));
  const fiches = new Map<string, Ref>();
  for (const [nom, url] of Object.entries(story.fiches?.cast ?? {})) {
    const r = enRef(await fetchAsDataUrl(url, petit));
    if (r) fiches.set(nom, r);
  }
  const tenue = (story.personnages ?? "").split(/\.\s|;|\n/)[0]?.slice(0, 220) || "the hero";
  const heros = { nom: req.childFirstName, description: tenue, image: heroImg };

  /** Personnages secondaires attendus sur une page (déclarés, sinon nommés dans la scène). */
  const presentsSur = (p: { presents?: string[]; scene_illustration: string } | null) => {
    const noms = [...fiches.keys()].filter((nom) =>
      p === null
        ? true
        : p.presents
          ? p.presents.some((x) => x.toLowerCase() === nom.toLowerCase())
          : p.scene_illustration.toLowerCase().includes(nom.toLowerCase()),
    );
    return noms.slice(0, 3).map((nom) => ({ nom, description: castVisuel.get(nom.toLowerCase()) ?? nom, image: fiches.get(nom)! }));
  };

  // Cibles : la couverture (-1) puis chaque page illustrée.
  const cibles: { i: number; url: string; scene: string; cast: ReturnType<typeof presentsSur> }[] = [];
  if (story.couvertureUrl) cibles.push({ i: -1, url: story.couvertureUrl, scene: `Book cover of "${story.titre}"`, cast: presentsSur(null) });
  story.pages.forEach((p, i) => {
    if (p.imageUrl) cibles.push({ i, url: p.imageUrl, scene: p.scene_illustration, cast: presentsSur(p) });
  });

  // Styles de la bible visuelle : leur grille, deux nouvelles tentatives, puis une scène simplifiée.
  const grille = estCarre(story.style) ? grillePour(story.style) : null;
  const controler = async (url: string, scene: string, cast: ReturnType<typeof presentsSur>) => {
    const img = enRef(await fetchAsDataUrl(url, petit));
    if (!img) return { ok: true, fix: "" };
    if (grille && (await zoneVide(img))) {
      return { ok: false, fix: "The picture has a blank, unpainted white area: paint the whole scene to every edge, no empty rectangle." };
    }
    const v = await verifier(heros, cast, img, scene, grille);
    // Relecture impossible (délai, panne passagère) : un second essai avant de la compter « non vérifiée ».
    if (!("nonVerifiee" in v && v.nonVerifiee)) return v;
    await new Promise((r) => setTimeout(r, 3000)); // fal saturé (10 requêtes simultanées) : on laisse passer la vague
    return verifier(heros, cast, img, scene, grille);
  };

  const verdicts = await avant(
    limite,
    // Au plus 4 relectures à la fois (fal : 10 requêtes simultanées par compte, tous livres confondus).
    mapLimit(cibles, 4, async (c) => ({ ...c, v: await controler(c.url, c.scene, c.cast) })),
  );
  if (!verdicts) return { story, bilan: "contrôle interrompu (temps)" };
  const fautives = verdicts.filter((c) => !c.v.ok);
  // Images que la relectrice n'a pas pu lire (panne, délai) : comptées, jamais confondues avec des images conformes.
  const nonVerifiees = verdicts.filter((c) => "nonVerifiee" in c.v && c.v.nonVerifiee).length;
  if (fautives.length === 0) {
    return {
      story: { ...story, controleImages: { verifiees: cibles.length - nonVerifiees, refaites: 0, nonVerifiees } },
      bilan: `contrôle : ${cibles.length - nonVerifiees} images conformes${nonVerifiees ? `, ${nonVerifiees} non vérifiées` : ""}`,
    };
  }

  // Redessin des fautives, en parallèle, 2 essais chacune.
  const commun = {
    style: story.style ?? req.style ?? "feerique",
    heroName: req.childFirstName,
    appearance: req.appearance,
    premium: req.premium,
    recurringCharacters: story.personnages,
    anchorImage: heroImg,
  };
  const graine = Date.now() % 1_000_000;
  /** Dernier recours : la même scène, avec moins de personnages et un décor simple. */
  const sceneSimplifiee = (c: (typeof fautives)[number]) => {
    const doudous = c.cast.filter((x) => /plush|never alive/i.test(x.description));
    const gardes = [req.childFirstName, ...doudous.map((x) => x.nom)].join(" and ");
    const base =
      c.i === -1
        ? `Book cover illustration for the story "${story.titre}": ${req.childFirstName} alone, in a calm emblematic pose`
        : `SIMPLIFIED version of this scene: ${c.scene}`;
    return {
      cast: doudous,
      scene: `${base}. Keep ONLY ${gardes}; remove every other character, crowd and animal. Simple, soft, uncluttered background with at most two elements of the setting. ${req.childFirstName} appears only ONCE, clearly visible, matching the reference exactly.`,
    };
  };
  // Jusqu'à 2 nouveaux dessins avec la correction demandée, puis la scène
  // simplifiée. Le livre part toujours : aucune relecture humaine.
  const corrigees = await mapLimit(fautives, 3, async (c, k) => {
    let fix = c.v.fix;
    for (let essai = 0; essai < 2; essai++) {
      const scene =
        (c.i === -1
          ? `Book cover illustration for the story "${story.titre}": ${req.childFirstName} in an emblematic moment, NOT a plain portrait`
          : c.scene) +
        `. IMPORTANT CORRECTION: ${fix}. ${req.childFirstName} appears only ONCE; every other character looks exactly like its reference sheet.`;
      const r = await avant(
        limite,
        generateIllustration({ ...commun, scene, castRefs: c.cast.map((x) => ({ name: x.nom, ...x.image })), seed: graine + 50 * k + essai }),
      );
      if (!r?.imageUrl) break;
      const v = await avant(limite, controler(r.imageUrl, c.scene, c.cast));
      if (v === null) return null;
      if (v.ok) return { i: c.i, url: r.imageUrl, simplifiee: false };
      fix = v.fix || fix;
    }
    if (!grille) return null;
    const simple = sceneSimplifiee(c);
    const r = await avant(
      limite,
      generateIllustration({ ...commun, scene: simple.scene, castRefs: simple.cast.map((x) => ({ name: x.nom, ...x.image })), seed: graine + 50 * k + 7 }),
    );
    // Une image vide de peinture est la seule raison d'écarter la scène simplifiée.
    if (!r?.imageUrl) return null;
    const img = enRef(await fetchAsDataUrl(r.imageUrl, petit));
    if (img && (await zoneVide(img))) return null;
    return { i: c.i, url: r.imageUrl, simplifiee: true };
  });

  const remplacees = corrigees.filter((x): x is { i: number; url: string; simplifiee: boolean } => x !== null);
  const parIndex = new Map(remplacees.map((x) => [x.i, x.url]));
  const simplifiees = remplacees.filter((x) => x.simplifiee).length;
  const nouvelle: Story = {
    ...story,
    couvertureUrl: parIndex.get(-1) ?? story.couvertureUrl,
    pages: story.pages.map((p, i) => (parIndex.has(i) ? { ...p, imageUrl: parIndex.get(i)! } : p)),
    imagesARevoir: undefined,
    // Suivi du coût : combien d'images la relectrice a fait refaire.
    controleImages: { verifiees: cibles.length - nonVerifiees, refaites: fautives.length, nonVerifiees },
  };
  const detail = fautives.map((c) => `${c.i === -1 ? "couverture" : `p${c.i + 1}`}: ${c.v.fix}`).join(" | ");
  return {
    story: nouvelle,
    bilan: `contrôle : ${fautives.length}/${cibles.length} à reprendre, ${remplacees.length} corrigées dont ${simplifiees} simplifiées — ${detail}`.slice(0, 900),
  };
}
