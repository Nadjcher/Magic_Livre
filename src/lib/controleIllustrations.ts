/**
 * Contrôle qualité des illustrations, comme un directeur artistique :
 * chaque page (et la couverture) est comparée aux fiches des personnages par
 * un modèle de vision. Erreurs recherchées, uniquement les graves :
 *  - le héros dessiné deux fois ;
 *  - un personnage qui change d'espèce ou de couleurs (un dragon devenu hippopotame) ;
 *  - un personnage récurrent en double, ou quelqu'un d'autre dans la tenue du héros.
 * Une page fautive est redessinée (2 essais au plus) avec la correction ; on
 * garde le nouveau dessin seulement s'il passe le contrôle.
 *
 * Tout est borné dans le temps et « best-effort » : en cas de souci, le livre
 * garde ses illustrations d'origine.
 */

import "server-only";
import { env } from "./env";
import { PRIX_ESTIMES, noterDepense } from "./budget";
import { estCarre, grillePour } from "./bibleVisuelle";
import { fetchAsDataUrl } from "./imageFetch";
import { generateIllustration } from "./illustration";
import type { Story } from "./storySchema";
import type { StoryRequest } from "./storyPrompt";

type Ref = { base64: string; mime: string };

const SYSTEME =
  "You are the strict art director of a children's picture book. You compare a page illustration with the " +
  "character reference sheets and report only clear, visible errors. Answer ONLY with JSON.";

function modele(): string {
  // Gemini Flash : ~0,05 centime par contrôle (15× moins cher que Sonnet) ;
  // il a repéré les mêmes erreurs sur notre jeu de test.
  // Claude Sonnet : Gemini Flash validait des images fautives (test du 11 nov.).
  return process.env.QA_VISION_MODEL || "anthropic/claude-sonnet-4.5";
}

export function controleActif(): boolean {
  return Boolean(env.falApiKey()) && process.env.QA_ILLUSTRATIONS !== "off";
}

function enRef(dataUrl: string | null): Ref | null {
  const m = dataUrl ? /^data:([^;]+);base64,(.+)$/.exec(dataUrl) : null;
  return m ? { mime: m[1] as string, base64: m[2] as string } : null;
}

const petit = { maxPx: 768, quality: 80 };

/** Le verdict d'un contrôle : ok, ou la correction à apporter. */
export async function verifier(
  heros: { nom: string; description: string; image: Ref },
  cast: { nom: string; description: string; image: Ref }[],
  page: Ref,
  scene: string,
  grille: string[] | null = null,
): Promise<{ ok: boolean; fix: string; nonVerifiee?: boolean }> {
  const lignes = [`Image 1 is the reference sheet of the hero ${heros.nom} (${heros.description}).`];
  cast.forEach((c, k) => lignes.push(`Image ${k + 2} is the reference sheet of ${c.nom} (${c.description}).`));
  if (grille) {
    // Style de la maison : la grille de la bible visuelle, question par question.
    lignes.push(
      `The LAST image is the book page to check. Scene requested: ${scene}`,
      "Answer EACH question with yes or no and one short sentence describing what you SEE. A single \"no\" means the image must be redone.",
      ...grille.map((q, i) => `${i + 1}. ${q}`),
      'Reply with JSON only: {"answers": [{"n": 1, "yes": true, "seen": "…"}], "fix": "ONLY if at least one answer is no: one short English instruction listing what to correct; otherwise an empty string"}',
      "Be consistent: if you see a real problem, answer no to the matching question.",
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
  try {
    const r = await fetch("https://fal.run/openrouter/router/vision", {
      method: "POST",
      headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modele(),
        system_prompt: SYSTEME,
        prompt: lignes.join("\n"),
        image_urls: images,
        // 9 réponses avec une phrase chacune : 400 jetons coupaient la réponse, qui passait alors sans contrôle.
        max_tokens: grille ? 1600 : 400,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(grille ? 90_000 : 40_000),
    });
    const j = (await r.json().catch(() => ({}))) as { output?: string; usage?: { cost?: number } };
    if (r.ok) await noterDepense(j.usage?.cost ?? PRIX_ESTIMES.vision);
    const json = /\{[\s\S]*\}/.exec(j.output ?? "")?.[0];
    if (!r.ok || !json) {
      console.error("[contrôle] vision indisponible :", r.status, JSON.stringify(j).slice(0, 160));
      return { ok: true, fix: "", nonVerifiee: true };
    }
    let v: { ok?: unknown; fix?: unknown; answers?: { n?: number; yes?: boolean; seen?: string }[] };
    try {
      v = JSON.parse(json);
    } catch {
      console.error("[contrôle] réponse illisible :", (j.output ?? "").slice(0, 160));
      return { ok: true, fix: "", nonVerifiee: true };
    }
    if (grille && !Array.isArray(v.answers)) return { ok: true, fix: "", nonVerifiee: true };
    if (grille && Array.isArray(v.answers)) {
      const non = v.answers.filter((a) => a.yes === false);
      const corrige = typeof v.fix === "string" ? v.fix.trim() : "";
      const fix = corrige || non.map((a) => `${grille[(a.n ?? 1) - 1] ?? ""} (${a.seen ?? ""})`).join("; ");
      // Une correction proposée compte comme un « non » : la relectrice disait parfois « oui » tout en décrivant un défaut.
      return { ok: non.length === 0 && corrige.length === 0, fix: fix.slice(0, 400) };
    }
    return { ok: v.ok !== false, fix: typeof v.fix === "string" ? v.fix.slice(0, 300) : "" };
  } catch {
    return { ok: true, fix: "", nonVerifiee: true }; // contrôle indisponible : on ne bloque jamais le livre, mais on le compte
  }
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

  // Styles de la bible visuelle (maison, 3D) : leur grille, une seule nouvelle tentative, puis relecture humaine.
  const grille = estCarre(story.style) ? grillePour(story.style) : null;
  const controler = async (url: string, scene: string, cast: ReturnType<typeof presentsSur>) => {
    const img = enRef(await fetchAsDataUrl(url, petit));
    if (!img) return { ok: true, fix: "" };
    if (grille && (await zoneVide(img))) {
      return { ok: false, fix: "The picture has a blank, unpainted white area: paint the whole scene to every edge, no empty rectangle." };
    }
    const v = await verifier(heros, cast, img, scene, grille);
    // Relecture impossible (délai, panne passagère) : un second essai avant de la compter « non vérifiée ».
    return "nonVerifiee" in v && v.nonVerifiee ? verifier(heros, cast, img, scene, grille) : v;
  };

  const verdicts = await avant(
    limite,
    Promise.all(cibles.map(async (c) => ({ ...c, v: await controler(c.url, c.scene, c.cast) }))),
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
  const corrigees = await Promise.all(
    fautives.map(async (c, k) => {
      let fix = c.v.fix;
      for (let essai = 0; essai < (grille ? 1 : 2); essai++) {
        const scene =
          (c.i === -1
            ? `Book cover illustration for the story "${story.titre}": ${req.childFirstName} in an emblematic moment, NOT a plain portrait`
            : c.scene) +
          `. IMPORTANT CORRECTION: ${fix}. ${req.childFirstName} appears only ONCE; every other character looks exactly like its reference sheet.`;
        const r = await avant(
          limite,
          generateIllustration({
            ...commun,
            scene,
            castRefs: c.cast.map((x) => ({ name: x.nom, ...x.image })),
            seed: graine + 50 * k + essai,
          }),
        );
        if (!r?.imageUrl) return null;
        const v = await avant(limite, controler(r.imageUrl, c.scene, c.cast));
        if (v === null) return null;
        if (v.ok) return { i: c.i, url: r.imageUrl };
        fix = v.fix || fix;
      }
      return null;
    }),
  );

  const remplacees = corrigees.filter((x): x is { i: number; url: string } => x !== null);
  const parIndex = new Map(remplacees.map((x) => [x.i, x.url]));
  // Pages restées fautives après la nouvelle tentative : relecture humaine (style de la maison).
  const aRevoir = grille ? fautives.filter((c) => !parIndex.has(c.i)).map((c) => c.i) : [];
  const nouvelle: Story = {
    ...story,
    couvertureUrl: parIndex.get(-1) ?? story.couvertureUrl,
    pages: story.pages.map((p, i) => (parIndex.has(i) ? { ...p, imageUrl: parIndex.get(i)! } : p)),
    ...(aRevoir.length ? { imagesARevoir: aRevoir } : {}),
    // Suivi du coût : combien d'images la relectrice a fait refaire.
    controleImages: { verifiees: cibles.length - nonVerifiees, refaites: fautives.length, nonVerifiees },
  };
  const detail = fautives.map((c) => `${c.i === -1 ? "couverture" : `p${c.i + 1}`}: ${c.v.fix}`).join(" | ");
  return {
    story: nouvelle,
    bilan: `contrôle : ${fautives.length}/${cibles.length} à reprendre, ${remplacees.length} corrigées — ${detail}`.slice(0, 900),
  };
}
