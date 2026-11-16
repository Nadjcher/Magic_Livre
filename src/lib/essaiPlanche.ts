/**
 * Essai de l'architecture « planches validées » (atelier, administrateurs) :
 *
 *   1. la PLANCHE : la scène de la page 7 du Petit Poucet, dessinée UNE fois
 *      sans l'enfant ni son doudou (forêt, Poucet, caillou) — ce qui est
 *      identique pour tous les enfants et sera validé une fois pour toutes ;
 *   2. l'INSERTION : l'enfant et son doudou ajoutés sur cette planche, sans
 *      toucher au reste (un seul dessin par page et par enfant).
 *
 * Question posée : le dessinateur sait-il ajouter Léo et Caramel sans abîmer
 * la planche ? Les fiches de Léo, Caramel et Poucet sont celles du jeu
 * d'épreuve (aucun dessin de fiche à payer). Environ 0,10 $ les deux images.
 */

import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { env } from "./env";
import { PRIX_ESTIMES, noterDepense } from "./budget";
import { STYLE_3D, consigneStylePour, INTERDITS_IMAGE } from "./bibleVisuelle";
import { compressImage } from "./blobStore";
import { fetchAllWithTimeout } from "./imageFetch";
import { falFetch } from "./jetonsFal";

const DOSSIER = path.join(process.cwd(), "src", "epreuve");

type Ref = { base64: string; mime: string };

const lire = async (f: string): Promise<Ref> => {
  const c = await compressImage(await readFile(path.join(DOSSIER, f)), "image/jpeg", { maxPx: 704, quality: 85 });
  return { base64: c.bytes.toString("base64"), mime: c.mime };
};
const enUrl = (r: Ref) => `data:${r.mime};base64,${r.base64}`;
const enRef = (dataUrl: string | undefined): Ref | null => {
  const m = dataUrl ? /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl) : null;
  return m ? { mime: m[1] as string, base64: m[2] as string } : null;
};

/** La planche : tout sauf l'enfant et son doudou. */
const SCENE_PLANCHE =
  "Reference image 1 is the character sheet of Poucet: draw Poucet EXACTLY like this (a tiny human boy, red knitted bonnet, brown jacket). " +
  `${consigneStylePour(STYLE_3D)} ` +
  "SCENE: inside a soft storybook forest at night, lit by the warm golden glow of one freshly drawn crooked white stone lying on the mossy ground " +
  "at the centre of the picture; the stone is a full solid lumpy shape with a slight golden glow. On the RIGHT side, tiny Poucet stands ON A MUSHROOM, " +
  "leaning forward toward the stone, laughing and twisting his red bonnet shyly; he is a toy-figurine-sized boy, small in the frame " +
  "(with his mushroom he takes no more than a quarter of the picture height). " +
  "The LEFT HALF of the foreground is an open patch of mossy ground, softly lit by the stone, deliberately kept free of any character or object: " +
  "a crouching child will be added there later. Poucet is the ONLY character: no child, no plush toy, no animal, no other person. " +
  INTERDITS_IMAGE;

/** L'insertion : l'enfant et son doudou, rien d'autre ne change. */
const SCENE_INSERTION =
  "Image 1 is a finished page of a children's picture book. KEEP IT EXACTLY AS IT IS: same forest, same light, same glowing white stone, " +
  "same tiny boy with the red bonnet on his mushroom (same place, same size, same pose), same framing and same rendering style. " +
  "ADD ONLY two things, in the free area on the left: " +
  "(a) the child of image 2 — same face, same hair color and haircut, same yellow pyjamas with small orange moons — crouching on the ground, " +
  "holding a pure white pencil whose tip touches the ground next to the glowing stone he has just drawn; the child is large in the frame " +
  "(crouching, he takes about two thirds of the picture height), so the tiny boy's red bonnet stays below the child's chest; " +
  "(b) the plush teddy bear of image 3 — same species, same colors — sitting on the ground beside the child: a soft toy, not alive, only once. " +
  "The child and the plush are rendered in the same style and lit by the same glow as the scene, with matching soft shadows on the ground. " +
  "Change nothing else. No letters, no text.";

async function dessiner(modele: string, prompt: string, refs: Ref[]): Promise<Ref> {
  const gemini = /nano-banana|gemini/.test(modele);
  const r = await falFetch(
    `https://fal.run/${modele}`,
    {
      method: "POST",
      headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        output_format: "jpeg",
        ...(gemini ? { aspect_ratio: "1:1" } : { image_size: "square_hd" }),
        image_urls: refs.map(enUrl),
      }),
    },
    150_000,
  );
  const j = (await r.json().catch(() => ({}))) as { images?: { url?: string }[]; detail?: unknown };
  if (!r.ok) throw new Error(`fal ${r.status} ${JSON.stringify(j.detail ?? j).slice(0, 200)}`);
  await noterDepense(gemini ? PRIX_ESTIMES.imagePremium : PRIX_ESTIMES.image);
  const url = j.images?.[0]?.url;
  if (!url) throw new Error("fal n'a renvoyé aucune image");
  const dl = await fetchAllWithTimeout(url, {}, { timeoutMs: 30_000, maxBytes: 20_000_000 });
  if (!dl.ok || !dl.bytes) throw new Error("téléchargement de l'image impossible");
  const c = await compressImage(dl.bytes, dl.contentType || "image/jpeg", { maxPx: 1024, quality: 84 });
  return { base64: c.bytes.toString("base64"), mime: c.mime };
}

/**
 * Part de la moitié droite de la planche (là où se tient Poucet) restée
 * identique après l'insertion, de 0 à 100. Mesurée par le code, sans IA :
 * 100 = rien n'a bougé ; en dessous de ~85, la planche a été redessinée.
 */
export async function partConservee(planche: Ref, resultat: Ref): Promise<number | null> {
  try {
    const { default: sharp } = await import("sharp");
    const N = 64;
    const gris = async (r: Ref) =>
      (await sharp(Buffer.from(r.base64, "base64")).resize(N, N, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true })).data;
    const [a, b] = await Promise.all([gris(planche), gris(resultat)]);
    let proches = 0;
    let total = 0;
    for (let y = 0; y < N; y++)
      for (let x = N / 2; x < N; x++) {
        total++;
        if (Math.abs((a[y * N + x] ?? 0) - (b[y * N + x] ?? 0)) <= 24) proches++;
      }
    return Math.round((100 * proches) / total);
  } catch {
    return null;
  }
}

export interface ResultatEssaiPlanche {
  planche: string;
  resultat: string;
  modele: string;
  /** Moitié droite de la planche conservée, en % (null si non mesurable). */
  conservee: number | null;
  /** Coût estimé de cet essai, en dollars. */
  cout: number;
}

/**
 * Lance l'essai. Sans `plancheExistante` : dessine la planche puis l'insertion.
 * Avec : refait seulement l'insertion (pour comparer l'autre modèle sur la même planche).
 */
export async function essaiPlanche(opts: { premium?: boolean; plancheExistante?: string } = {}): Promise<ResultatEssaiPlanche> {
  if (!env.falApiKey()) throw new Error("FAL_API_KEY absente");
  const [heros, caramel, poucet] = await Promise.all([lire("poucet-fiche-heros.jpg"), lire("poucet-fiche-caramel.jpg"), lire("poucet-fiche-poucet.jpg")]);
  let cout = 0;
  let planche = enRef(opts.plancheExistante);
  if (!planche) {
    planche = await dessiner(env.falImageModel(), SCENE_PLANCHE, [poucet]);
    cout += PRIX_ESTIMES.image;
  }
  const modele = opts.premium ? env.falImageModelPremium() : env.falImageModel();
  const resultat = await dessiner(modele, SCENE_INSERTION, [planche, heros, caramel]);
  cout += opts.premium ? PRIX_ESTIMES.imagePremium : PRIX_ESTIMES.image;
  return { planche: enUrl(planche), resultat: enUrl(resultat), modele, conservee: await partConservee(planche, resultat), cout };
}
