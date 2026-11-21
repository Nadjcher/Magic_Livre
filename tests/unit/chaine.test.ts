/**
 * Banc d'essai de la chaîne complète de création d'un livre, SANS RIEN PAYER :
 * l'écriture (Claude via fal) et le dessin (flux via fal) sont remplacés par
 * de faux services qui enregistrent ce qu'on leur demande. On vérifie que la
 * bonne histoire est demandée, que les bons modèles sont donnés à l'autrice,
 * que chaque image reçoit les bonnes références (le portrait validé de
 * l'enfant, les fiches des personnages), et que les règles du code s'appliquent.
 *
 * Chaque bug trouvé par un livre payant doit finir ici, pour ne jamais revenir.
 */

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

/* ─── Faux monde ─── */

type Appel = { url: string; corps: Record<string, unknown> };
const monde = vi.hoisted(() => ({
  appels: [] as Appel[],
  images: new Map<string, Buffer>(), // nom → octets JPEG
  noms: new Map<string, string>(), // base64 → nom
  compteur: 0,
  histoireSuivante: null as unknown,
  planches: [] as { histoire: string; style: string; cle: string; url: string; valide: boolean }[],
  enregistre: null as unknown,
  /** L'agent de vérification voit une scène remplacée (la retouche a renvoyé autre chose). */
  sceneRemplacee: false,
}));

async function fausseImage(nom: string): Promise<string> {
  const n = monde.compteur++;
  // Couleur unique et sombre (pas de « cadre blanc » à retirer).
  const buf = await sharp({ create: { width: 16, height: 16, channels: 3, background: { r: (n * 37) % 120, g: (n * 71) % 120, b: (n * 13) % 120 } } })
    .jpeg()
    .toBuffer();
  monde.images.set(nom, buf);
  monde.noms.set(buf.toString("base64"), nom);
  return `https://faux.test/${encodeURIComponent(nom)}`;
}
/** Le nom d'une image envoyée en référence (data URL). */
const nomDe = (dataUrl: unknown) => monde.noms.get(String(dataUrl).split(",")[1] ?? "") ?? "?";

vi.mock("@/lib/jetonsFal", () => ({
  falFetch: async (url: string, init: { body?: string }) => {
    const corps = JSON.parse(init.body ?? "{}") as Record<string, unknown>;
    monde.appels.push({ url, corps });
    const json = (j: unknown) => new Response(JSON.stringify(j), { status: 200, headers: { "Content-Type": "application/json" } });
    if (url.includes("openrouter/router/vision")) {
      return json({ output: JSON.stringify({ hair_page: "black", hair_length_page: "short", hair_reference: "black", hair_length_reference: "short", plush_animal: "", plush_count: 0, present: {}, head_twisted: false, frame: false, same_scene: !monde.sceneRemplacee }) });
    }
    if (url.includes("openrouter/router")) {
      const systeme = String(corps.system_prompt ?? "");
      const prompt = String(corps.prompt ?? "");
      if (/éditeur jeunesse exigeant pour Encore une histoire/.test(systeme)) {
        const notes = { voix_haute: 5, ritournelle: 5, structure: 5, enfant_agit: 5, personnalisation: 5, feerique: 5, age: 5, fin: 5 };
        return json({ output: JSON.stringify({ eliminatoire: null, notes, justifications: Object.fromEntries(Object.keys(notes).map((k) => [k, "« cité » : bien."])), total: 40, verdict: "accepte", corrections: [] }) });
      }
      if (/Doudou \(saisi par le parent\)/.test(prompt)) return json({ output: JSON.stringify({ fille: false, doudou: { nom: "", son: "son doudou", visuel: "" } }) });
      return json({ output: JSON.stringify(monde.histoireSuivante) });
    }
    // Un dessin : une nouvelle fausse image.
    return json({ images: [{ url: await fausseImage(`dessin-${monde.compteur}`) }] });
  },
}));

vi.mock("@/lib/imageFetch", () => {
  const octets = (url: string) => monde.images.get(decodeURIComponent(url.replace("https://faux.test/", "")));
  return {
    fetchAllWithTimeout: async (url: string) => {
      const b = octets(url);
      return b ? { ok: true, bytes: b, contentType: "image/jpeg" } : { ok: false };
    },
    fetchAsDataUrl: async (url: string | null | undefined) => {
      if (!url) return null;
      if (url.startsWith("data:")) return url;
      const b = octets(url);
      return b ? `data:image/jpeg;base64,${b.toString("base64")}` : null;
    },
    resolveImages: async (urls: unknown[]) => urls,
  };
});

vi.mock("@/lib/blobStore", () => ({
  blobEnabled: () => false,
  compressImage: async (bytes: Buffer, mime: string) => ({ bytes, mime }),
  putBlob: async () => "",
  isPrivateBlobRef: () => false,
}));

vi.mock("@/lib/budget", async (orig) => ({ ...(await orig<object>()), noterDepense: async () => undefined, budgetDepasse: async () => false }));
vi.mock("@/lib/notifications", () => ({ alerterAdmin: async () => undefined }));
vi.mock("@/lib/bookPipeline", () => ({ signer: () => "", lancerIllustrations: async () => undefined }));

vi.mock("@/lib/prisma", async () => {
  const { BIBLIOTHEQUE_DEPART } = await import("@/lib/bibliothequeDepart");
  const exemples = BIBLIOTHEQUE_DEPART.map((e) => ({ ...e, id: `depart:${e.cle}`, source: "depart", actif: true, utilisations: 0 }));
  const sql = (s: TemplateStringsArray | string) => (typeof s === "string" ? s : s.join("?"));
  return {
    prisma: {
      $executeRaw: async () => 0,
      $executeRawUnsafe: async () => 0,
      $transaction: async (x: unknown) => x,
      $queryRaw: async (s: TemplateStringsArray, ...v: unknown[]) => {
        const q = sql(s);
        if (q.includes('FROM "Exemple"')) {
          if (q.includes("ANY")) return exemples.filter((e) => (v[0] as string[]).includes(e.id));
          if (q.includes("type = 'trame'")) return exemples.filter((e) => e.type === "trame" && e.ageMin <= Number(v[0]) && e.ageMax >= Number(v[1]));
          return exemples.filter((e) => e.ageMin - 1 <= Number(v[0]) && e.ageMax + 1 >= Number(v[1]));
        }
        if (q.includes('FROM "Planche"')) return monde.planches.filter((p) => p.histoire === v[0] && p.style === v[1]).map((p) => ({ ...p, deDos: null, verdict: null }));
        return [];
      },
      book: {
        update: async ({ data }: { data: { pages?: unknown } }) => {
          if (data.pages) monde.enregistre = data.pages;
          return {};
        },
        findMany: async () => [],
      },
    },
  };
});

/* ─── Les modules réels, chargés après les faux ─── */

let portrait = { base64: "", mime: "image/jpeg" };
beforeAll(async () => {
  process.env.FAL_API_KEY = "test";
  process.env.IMAGE_PROVIDER = "fal";
  process.env.FACE_PROVIDER = "none";
  process.env.QA_ILLUSTRATIONS = "off";
  await fausseImage("PORTRAIT VALIDÉ");
  portrait = { base64: monde.images.get("PORTRAIT VALIDÉ")!.toString("base64"), mime: "image/jpeg" };
});
afterEach(() => {
  monde.appels.length = 0;
  monde.planches.length = 0;
  monde.enregistre = null;
  monde.sceneRemplacee = false;
});

const ecritures = () => monde.appels.filter((a) => a.url.includes("openrouter/router") && !a.url.includes("vision") && !/éditeur jeunesse exigeant/.test(String(a.corps.system_prompt)));
const dessins = () => monde.appels.filter((a) => !a.url.includes("openrouter"));
const refs = (a: Appel) => ((a.corps.image_urls as string[] | undefined) ?? []).map(nomDe);

/** Une histoire écrite « par l'IA », valide, en français. */
function histoire(titre: string, prenom: string, cast: { nom: string; visuel: string }[], pages: { texte: string; scene: string; presents: string[] }[]) {
  return {
    plan: { objet_cle: "x", compagnon: "x", ritournelle: "x", emotion_depart: "x", emotion_arrivee: "x", cases: [], accroche_suite: "x" },
    titre,
    personnages: `${prenom} (hero): a red t-shirt, blue jeans. ${cast.map((c) => `${c.nom}: ${c.visuel}`).join(". ")}`,
    cast,
    // Au moins 4 pages (règle du livre), et des scènes assez détaillées pour le vérificateur.
    pages: [...pages, ...Array.from({ length: Math.max(0, 4 - pages.length) }, () => ({ texte: `${prenom} rentre à la maison en souriant.`, scene: "", presents: [] }))].map((p) => ({
      texte: p.texte,
      scene_illustration: `${p.scene || `${prenom} walks home smiling`}, in a soft storybook setting with warm evening light, medium shot.`,
      presents: p.presents,
    })),
    resume: "Résumé de l'histoire.",
    fils: "La suite reste ouverte.",
    faits: "Rien.",
    suites: ["Une suite drôle.", "Une suite aventure.", "Une suite tendre."],
  };
}

/** L'histoire écrite, ou l'erreur telle quelle (le test échoue avec le vrai message). */
function histoireDe(r: { ok: true; story: unknown } | { ok: false; message: string }): never {
  if (!r.ok) throw new Error(r.message);
  return r.story as never;
}

const reqBase = { childFirstName: "Kamil", childAge: 6, longueur: "moyenne" as const, style: "anim3d" as const, parent: "Papa", genre: "garcon" as const };

/* ─── Les scénarios ─── */

describe("Jack et le haricot magique (classique écrit par l'IA)", () => {
  it("l'autrice reçoit Jack, jamais la trame du Petit Poucet ; chaque page reçoit le portrait validé", async () => {
    const { generateStory, relireHistoire } = await import("@/lib/storyGenerator");
    const { livrer } = await import("@/lib/livraison");
    const { illustrateStory } = await import("@/lib/storyGenerator");
    const geant = { nom: "Bougon", visuel: "GIANT: a huge clumsy but kind giant with a curly brown beard, patched green coat" };
    monde.histoireSuivante = histoire("Kamil et le haricot géant", "Kamil", [geant], [
      { texte: "Kamil échange la vache contre trois haricots qui brillent.", scene: "Kamil holds three glowing beans in a farmyard, medium shot.", presents: [] },
      { texte: "Au matin, une tige immense monte jusqu'aux nuages. Kamil grimpe.", scene: "Kamil climbs a giant beanstalk above the clouds, wide shot.", presents: [] },
      { texte: "Dans le château, Bougon le géant ronfle. Kamil avance sur la pointe des pieds.", scene: "Kamil tiptoes past Bougon sleeping in a cloud castle.", presents: ["Bougon"] },
      { texte: "Bougon se réveille et sourit : Kamil devient son ami.", scene: "Bougon smiles at Kamil, close-up.", presents: ["Bougon"] },
    ]);
    const req = { ...reqBase, mode: "theme" as const, themeId: "haricot-magique" };
    const r = await generateStory(req, { illustrer: false, relire: false });
    expect(r.ok).toBe(true);
    const demande = ecritures().map((a) => String(a.corps.prompt)).join("\n");
    expect(demande).toContain("Jack et le haricot magique");
    expect(demande).not.toContain("TRAME IMPOSÉE");
    expect(demande).not.toMatch(/Poucet/);

    const relue = await relireHistoire(histoireDe(r), req);
    await livrer({ bookId: "b1", req, portrait, tentative: 1 }, relue);
    const enregistree = monde.enregistre as { titre: string; pages: { scene_illustration: string }[] };
    expect(enregistree.titre).toBe("Kamil et le haricot géant");
    for (const p of enregistree.pages) expect(p.scene_illustration).toContain("ONLY these characters are visible");

    monde.appels.length = 0;
    const { story } = await illustrateStory(enregistree as never, req, portrait, { controle: false });
    const d = dessins();
    const ficheHeros = d.find((a) => String(a.corps.prompt).includes("Character model sheet of the hero"))!;
    expect(refs(ficheHeros)).toEqual(["PORTRAIT VALIDÉ"]);
    const pages = d.filter((a) => !String(a.corps.prompt).includes("Character model sheet"));
    expect(pages.length).toBe(5); // couverture + 4 pages
    for (const a of pages) expect(refs(a)).toContain("PORTRAIT VALIDÉ");
    // La page avec le géant reçoit aussi sa fiche.
    const ficheGeant = d.find((a) => String(a.corps.prompt).includes("Character model sheet of Bougon"))!;
    expect(ficheGeant).toBeTruthy();
    expect(story.pages.every((p) => p.imageUrl)).toBe(true);
  });
});

describe("Le Petit Poucet (histoire toute prête, planches validées)", () => {
  it("aucune phrase écrite par l'IA, le nouveau titre, et chaque retouche reçoit le portrait validé", async () => {
    const { maitressePour } = await import("@/lib/histoiresMaitresses");
    const { histoireDepuisMaitresse } = await import("@/lib/maitresseGenerateur");
    const { clesPlanches } = await import("@/lib/planches");
    const { illustrateStory } = await import("@/lib/storyGenerator");
    const h = maitressePour("petit-poucet", 6)!;
    for (const k of clesPlanches(h)) monde.planches.push({ histoire: h.id, style: "anim3d", cle: k.cle, url: await fausseImage(`planche ${k.cle}`), valide: true });

    const req = { ...reqBase, mode: "theme" as const, themeId: "petit-poucet" };
    const story = await histoireDepuisMaitresse(h, req);
    expect(story.titre).toBe("Kamil au pays du Petit Poucet");
    expect(ecritures().filter((a) => !/Doudou \(saisi/.test(String(a.corps.prompt))).length).toBe(0);

    monde.appels.length = 0;
    const { story: illustre } = await illustrateStory(story, req, portrait, { controle: false });
    const retouches = dessins().filter((a) => String(a.corps.prompt).startsWith("Image 1 is a finished, approved book page"));
    expect(retouches.length).toBeGreaterThan(0);
    for (const a of retouches) {
      const r = refs(a);
      expect(r[0]).toMatch(/^planche /); // on part toujours de la planche validée
      const prompt = String(a.corps.prompt);
      // Enfant de face : son vrai visage (le portrait validé). Vraiment de dos (page 8) : seulement ses cheveux.
      if (prompt.includes("the big child") && !prompt.includes("FROM BEHIND")) expect(r).toContain("PORTRAIT VALIDÉ");
    }
    // Seule la page 8 a l'enfant de dos (le parent de dos de la page 1 ne compte pas).
    expect(retouches.filter((a) => String(a.corps.prompt).includes("FROM BEHIND")).length).toBe(1);
    expect(illustre.couvertureUrl).toBeTruthy();
  });
});

describe("L'agent fait refaire une page retouchée", () => {
  it("scène remplacée (Kamil debout à la place de la page) : refaite depuis la planche, avec le vrai visage", async () => {
    const { maitressePour } = await import("@/lib/histoiresMaitresses");
    const { histoireDepuisMaitresse } = await import("@/lib/maitresseGenerateur");
    const { clesPlanches, controlerRetouches } = await import("@/lib/planches");
    const { illustrateStory } = await import("@/lib/storyGenerator");
    const h = maitressePour("petit-poucet", 6)!;
    for (const k of clesPlanches(h)) monde.planches.push({ histoire: h.id, style: "anim3d", cle: k.cle, url: await fausseImage(`planche ${k.cle}`), valide: true });
    const req = { ...reqBase, mode: "theme" as const, themeId: "petit-poucet" };
    const { story } = await illustrateStory(await histoireDepuisMaitresse(h, req), req, portrait, { controle: false });
    monde.appels.length = 0;
    monde.sceneRemplacee = true;
    const { story: controle } = await controlerRetouches(story, Date.now() + 60_000, portrait);
    const vision = monde.appels.find((a) => a.url.includes("vision"))!;
    expect(String(vision.corps.prompt)).toContain('"same_scene"');
    const refaites = dessins().filter((a) => String(a.corps.prompt).includes("keep EXACTLY the scene of the original page"));
    expect(refaites.length).toBeGreaterThan(0);
    for (const a of refaites) {
      expect(refs(a)[0]).toMatch(/^planche /);
      if (!String(a.corps.prompt).includes("FROM BEHIND")) expect(refs(a)).toContain("PORTRAIT VALIDÉ");
    }
    expect(controle.controleImages?.refaites).toBe(refaites.length);
  });
});

describe("Idée libre avec maman en photo", () => {
  it("maman a sa fiche et son visage ; ni foule ni plus de deux personnages par image", async () => {
    const { generateStory, illustrateStory } = await import("@/lib/storyGenerator");
    const { livrer } = await import("@/lib/livraison");
    const maman = { nom: "Sarah", visuel: "HUMAN WOMAN: a smiling woman with long curly black hair, green sweater" };
    const chat = { nom: "Moka", visuel: "CAT: a small grey cat" };
    const fee = { nom: "Lili", visuel: "FAIRY: a tiny fairy with a green dress" };
    monde.histoireSuivante = histoire("Kamil et la cabane des nuages", "Kamil", [maman, chat, fee], [
      { texte: "Kamil et Sarah construisent une cabane dans les nuages.", scene: "Kamil and Sarah build a cloud hut.", presents: ["Sarah"] },
      { texte: "Moka le chat et Lili la fée arrivent, avec Sarah.", scene: "Kamil, Sarah, Moka and Lili sit in the hut.", presents: ["Sarah", "Moka", "Lili"] },
    ]);
    const req = {
      ...reqBase,
      mode: "libre" as const,
      prompt: "Kamil construit une cabane dans les nuages avec sa maman.",
      extras: [{ name: "Sarah", role: "maman", appearance: "long curly black hair, brown eyes" }],
    };
    const r = await generateStory(req, { illustrer: false, relire: false });
    const demande = ecritures().map((a) => String(a.corps.prompt)).join("\n");
    expect(demande).toContain("AUTRES PERSONNAGES RÉELS");
    expect(demande).toContain("HUMAN WOMAN");
    await livrer({ bookId: "b2", req, portrait, tentative: 1 }, histoireDe(r));
    const enregistree = monde.enregistre as { pages: { presents?: string[]; scene_illustration: string }[] };
    expect(enregistree.pages[1]!.presents!.length).toBeLessThanOrEqual(2);
    expect(enregistree.pages[1]!.scene_illustration).toContain("no crowd");

    monde.appels.length = 0;
    await illustrateStory(enregistree as never, req, portrait, { controle: false });
    const d = dessins();
    expect(d.some((a) => String(a.corps.prompt).includes("Character model sheet of Sarah"))).toBe(true);
    // La règle de dessin laisse voir le visage d'un proche qui a sa fiche.
    expect(d.some((a) => String(a.corps.prompt).includes("A family member WITH a reference sheet"))).toBe(true);
  });
});

describe("Personnages maison", () => {
  it("un dragon maison validé est repris tel quel ; un dragon rouge demandé garde son propre dessin", async () => {
    const { generateStory, illustrateStory } = await import("@/lib/storyGenerator");
    const { livrer } = await import("@/lib/livraison");
    const { PERSONNAGES_MAISON, HISTOIRE_MAISON } = await import("@/lib/personnagesMaison");
    const dragonMaison = PERSONNAGES_MAISON.find((p) => p.id === "dragon")!;
    const remplir = async () => monde.planches.push({ histoire: HISTOIRE_MAISON, style: "anim3d", cle: "dragon", url: await fausseImage("DRAGON MAISON"), valide: true });

    // 1. L'histoire choisit le dragon maison.
    await remplir();
    monde.histoireSuivante = histoire("Kamil et le dragon", "Kamil", [{ nom: "Pistache", visuel: dragonMaison.visuel }], [
      { texte: "Kamil trouve Pistache, un petit dragon, dans le jardin.", scene: "Kamil meets Pistache in the garden.", presents: ["Pistache"] },
    ]);
    const req = { ...reqBase, mode: "libre" as const, prompt: "Kamil trouve un bébé dragon dans le jardin." };
    let r = await generateStory(req, { illustrer: false, relire: false });
    expect(ecritures().map((a) => String(a.corps.prompt)).join("\n")).toContain("PERSONNAGES DE LA MAISON");
    await livrer({ bookId: "b3", req, portrait, tentative: 1 }, histoireDe(r));
    const avecMaison = monde.enregistre as { cast: { maison?: string }[] };
    expect(avecMaison.cast[0]!.maison).toBe("dragon");
    monde.appels.length = 0;
    await illustrateStory(avecMaison as never, req, portrait, { controle: false });
    expect(dessins().some((a) => String(a.corps.prompt).includes("Character model sheet of Pistache"))).toBe(false);
    expect(dessins().filter((a) => !String(a.corps.prompt).includes("Character model sheet")).some((a) => refs(a).includes("DRAGON MAISON"))).toBe(true);

    // 2. Le parent voulait un dragon rouge : pas le dragon maison.
    monde.appels.length = 0;
    monde.planches.length = 0;
    await remplir();
    monde.histoireSuivante = histoire("Kamil et le dragon rouge", "Kamil", [{ nom: "Braise", visuel: "DRAGON: a big red dragon with golden wings" }], [
      { texte: "Kamil rencontre Braise, un grand dragon rouge.", scene: "Kamil meets Braise.", presents: ["Braise"] },
    ]);
    r = await generateStory({ ...req, prompt: "Kamil et un dragon rouge" }, { illustrer: false, relire: false });
    await livrer({ bookId: "b4", req, portrait, tentative: 1 }, histoireDe(r));
    expect((monde.enregistre as { cast: { maison?: string }[] }).cast[0]!.maison).toBeUndefined();
  });
});

describe("Le formulaire s'ouvre sur l'histoire demandée", () => {
  it("Jack depuis le catalogue reste Jack (jamais remplacé par le Petit Poucet)", async () => {
    const { themeDeDepart } = await import("@/lib/themes");
    expect(themeDeDepart("haricot-magique").theme.id).toBe("haricot-magique");
    expect(themeDeDepart("haricot-magique").indispo).toBeNull();
    // Un thème pas encore disponible : on le dit.
    const noel = themeDeDepart("noel");
    expect(noel.theme.id).not.toBe("noel");
    expect(noel.indispo).toBeTruthy();
  });
});
