/**
 * Banc d'essai de la FIN de la chaîne, sans rien payer : le dessin, la
 * vérification des images, puis la porte de qualité, avec la vraie
 * orchestration (bookPipeline.ts, apercu.ts) et de faux services.
 *
 * Ce qu'on vérifie : un livre sain devient « prêt » ; un livre dont une image
 * manque, reste fautive ou n'a pas pu être vérifiée est RETENU (« draft »),
 * jamais montré au parent ; et un livre sain n'est jamais retenu à tort.
 */

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

type Appel = { url: string; corps: Record<string, unknown> };
type Livre = { id: string; status: string; pages: unknown; errorMessage: string | null; title?: string };

const monde = vi.hoisted(() => ({
  appels: [] as Appel[],
  images: new Map<string, Buffer>(),
  compteur: 0,
  livres: new Map<string, Livre>(),
  alertes: [] as string[],
  emails: [] as string[],
  /** Ce que voit l'agent de vérification : "ok", "double" (héros dessiné deux fois), "panne". */
  vision: "ok" as "ok" | "double" | "panne",
  /** Le dessin échoue pour les scènes qui contiennent ce mot. */
  dessinEchoue: "" as string,
  /** Une commande d'impression est enregistrée sur ce livre PENDANT sa vérification. */
  commandePendant: "" as string,
}));

async function fausseImage(nom: string): Promise<string> {
  const n = monde.compteur++;
  // Dégradé coloré (ni cadre blanc, ni zone vide) : une image « peinte ».
  const w = 64;
  const brut = Buffer.alloc(w * w * 3);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    brut[i] = (40 + x * 2 + n * 7) % 200;
    brut[i + 1] = (30 + y * 2 + n * 13) % 200;
    brut[i + 2] = (60 + ((x + y) % 50) * 2 + n * 5) % 200;
  }
  monde.images.set(nom, await sharp(brut, { raw: { width: w, height: w, channels: 3 } }).jpeg().toBuffer());
  return `https://faux.test/${encodeURIComponent(nom)}`;
}

vi.mock("@/lib/jetonsFal", () => ({
  falFetch: async (url: string, init: { body?: string }) => {
    const corps = JSON.parse(init.body ?? "{}") as Record<string, unknown>;
    monde.appels.push({ url, corps });
    const json = (j: unknown) => new Response(JSON.stringify(j), { status: 200, headers: { "Content-Type": "application/json" } });
    const prompt = String(corps.prompt ?? "");
    if (url.includes("openrouter/router/vision")) {
      const enCours = monde.commandePendant ? monde.livres.get(monde.commandePendant) : undefined;
      if (enCours) {
        monde.livres.set(enCours.id, { ...enCours, pages: { ...(enCours.pages as object), impressionsAValider: [{ orderId: "cmd1", depuis: 1, retouchesAuDebut: 0 }] } });
        monde.commandePendant = "";
      }
      if (monde.vision === "panne") return new Response("{}", { status: 503 });
      if (/real photo of a child/.test(prompt)) {
        const t = { hair: "black", texture: "straight", length: "short", skin: "light", glasses: false };
        return json({ output: JSON.stringify({ photo: t, drawing: t }) });
      }
      // Inventaire d'une page de livre sur mesure.
      return json({
        output: JSON.stringify({
          page_hair: "black", heights: [], plush_toys: [], other_humans: [],
          hero: { count: monde.vision === "double" ? 2 : 1, pose: "standing", hair_reference: "black", hair_seen: "black", hair_texture_reference: "straight", hair_texture_seen: "straight", skin_reference: "light", skin_seen: "light", face_and_outfit_match_reference: true },
          characters: [], explicit_rule_violations: [], unexpected_characters: [], anatomy_defects: [],
          letters_or_text: false, blank_unpainted_area: false, style_consistent: true, frightening: false,
        }),
      });
    }
    if (url.includes("openrouter/router")) return json({ output: "{}" });
    if (monde.dessinEchoue && prompt.includes(monde.dessinEchoue)) return new Response(JSON.stringify({ detail: "erreur du service" }), { status: 400 });
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
vi.mock("@/lib/idempotence", () => ({ reserver: async () => true, liberer: async () => undefined }));
vi.mock("@/lib/notifications", () => ({
  alerterAdmin: async (sujet: string) => void monde.alertes.push(sujet),
  notifierRelecture: async (id: string) => void monde.emails.push(`relecture:${id}`),
  notifierLivrePret: async (id: string) => void monde.emails.push(`pret:${id}`),
  notifierEchecHistoire: async () => undefined,
}));
vi.mock("@/lib/subscription", () => ({ getAbonnement: async () => ({ actif: false, restants: 0 }) }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRaw: async () => 0,
    $executeRawUnsafe: async () => 0,
    $transaction: async (x: unknown) => x,
    $queryRaw: async () => [],
    order: { findFirst: async () => null },
    book: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const b = monde.livres.get(where.id);
        return b ? { ...b, tier: "standard", child: { firstName: "Kamil", age: 6 } } : null;
      },
      findFirst: async ({ where }: { where: { id: string } }) => monde.livres.get(where.id) ?? null,
      findMany: async () => [],
      update: async ({ where, data }: { where: { id: string }; data: Partial<Livre> }) => {
        const b = monde.livres.get(where.id);
        if (b) monde.livres.set(where.id, { ...b, ...data });
        return {};
      },
      updateMany: async () => ({ count: 0 }),
    },
  },
}));

let photo = { base64: "", mime: "image/jpeg" };
beforeAll(async () => {
  process.env.FAL_API_KEY = "test";
  process.env.IMAGE_PROVIDER = "fal";
  process.env.FACE_PROVIDER = "none";
  delete process.env.QA_ILLUSTRATIONS; // la vérification des images est ACTIVE, comme en production
  await fausseImage("PHOTO");
  photo = { base64: monde.images.get("PHOTO")!.toString("base64"), mime: "image/jpeg" };
  // Les appels internes (une exécution par étape) n'existent pas ici : chaque étape tourne sur place.
  vi.stubGlobal("fetch", async () => {
    throw new Error("pas de réseau dans le banc d'essai");
  });
});
afterEach(() => {
  monde.appels.length = 0;
  monde.livres.clear();
  monde.alertes.length = 0;
  monde.emails.length = 0;
  monde.vision = "ok";
  monde.dessinEchoue = "";
  monde.commandePendant = "";
});

/** Un livre sur mesure écrit, relu et cadré, prêt à être dessiné. */
function livreEcrit(id: string, apercu = false): void {
  const page = (n: number) => ({
    texte: `Kamil avance sur le chemin, page ${n}.`,
    scene_illustration: `Kamil walks on a forest path at dusk, scene ${n}, medium shot. ONLY these characters are visible: the hero (once). No other people, animals or creatures, no crowd, no background figures.`,
    presents: [],
  });
  monde.livres.set(id, {
    id,
    status: "generating",
    errorMessage: null,
    pages: {
      titre: "Kamil et le chemin des étoiles",
      personnages: "Kamil (hero): a red t-shirt, blue jeans, white sneakers.",
      cast: [],
      pages: [page(1), page(2), page(3), page(4)],
      style: "anim3d",
      qualite: { note: 9, problemes: [], reecrit: false, accepte: true },
      meta: { age: 6, mode: "libre" },
      ...(apercu ? { apercu: true } : {}),
    },
  });
}
const req = (apercu = false) => ({ childFirstName: "Kamil", childAge: 6, mode: "libre" as const, longueur: "moyenne" as const, style: "anim3d" as const, photo, apercu });
const etat = (id: string) => monde.livres.get(id)!;
const pagesDe = (id: string) => etat(id).pages as { couvertureUrl?: string; apercu?: boolean; pages: { imageUrl?: string | null }[]; controleImages?: { verifiees: number; nonVerifiees?: number; douteuses?: number[] }; retenue?: string[]; imagesARevoir?: number[] };

describe("Fin de fabrication d'un livre sur mesure", () => {
  it("un livre sain devient « prêt », toutes ses images vérifiées, et le parent reçoit « votre livre est prêt »", async () => {
    const { illustrerLivre } = await import("@/lib/bookPipeline");
    livreEcrit("sain");
    await illustrerLivre({ bookId: "sain", req: req(), portrait: null });
    expect(etat("sain").status).toBe("ready");
    const p = pagesDe("sain");
    expect(p.couvertureUrl).toBeTruthy();
    expect(p.pages.every((x) => x.imageUrl)).toBe(true);
    expect(p.controleImages).toMatchObject({ verifiees: 5, nonVerifiees: 0 });
    expect(p.retenue).toBeUndefined();
    expect(monde.emails).toEqual(["pret:sain"]);
    expect(monde.alertes).toEqual([]);
  });

  it("un aperçu gratuit sain (couverture + 3 pages) devient « prêt » lui aussi", async () => {
    const { illustrerLivre } = await import("@/lib/bookPipeline");
    livreEcrit("apercu", true);
    await illustrerLivre({ bookId: "apercu", req: req(true), portrait: null });
    expect(etat("apercu").status).toBe("ready");
    expect(pagesDe("apercu").pages.filter((x) => x.imageUrl).length).toBe(3);
    expect(monde.alertes).toEqual([]);
  });

  it("vérification en panne : le livre est retenu, jamais « prêt », et l'atelier est prévenu", async () => {
    const { illustrerLivre } = await import("@/lib/bookPipeline");
    livreEcrit("panne");
    monde.vision = "panne";
    await illustrerLivre({ bookId: "panne", req: req(), portrait: null });
    expect(etat("panne").status).toBe("draft");
    expect(pagesDe("panne").retenue?.join(" ")).toMatch(/non vérifiée|pas été vérifiées|n'a pas pu/);
    expect(monde.emails).toEqual(["relecture:panne"]);
    expect(monde.alertes.join(" ")).toContain("retenu");
  }, 60_000); // le site attend 3 s avant de réessayer une vérification en panne

  it("image restée fautive après tous les essais (héros en double) : retenu, aperçu gratuit compris", async () => {
    const { illustrerLivre } = await import("@/lib/bookPipeline");
    livreEcrit("fautif", true);
    monde.vision = "double";
    await illustrerLivre({ bookId: "fautif", req: req(true), portrait: null });
    expect(etat("fautif").status).toBe("draft");
    expect(pagesDe("fautif").imagesARevoir?.length).toBeGreaterThan(0);
    expect(monde.emails).toEqual(["relecture:fautif"]);
  });

  it("une image n'a pas pu être dessinée : le livre est retenu au lieu de partir avec une page vide", async () => {
    const { illustrerLivre } = await import("@/lib/bookPipeline");
    livreEcrit("troue");
    monde.dessinEchoue = "scene 3";
    await illustrerLivre({ bookId: "troue", req: req(), portrait: null });
    expect(etat("troue").status).toBe("draft");
    expect(pagesDe("troue").retenue?.join(" ")).toContain("image manquante");
    expect(pagesDe("troue").imagesARevoir).toContain(2);
  });
});

describe("Une commande d'impression enregistrée pendant la vérification", () => {
  it("n'est pas effacée quand le livre devient « prêt » (sinon : commande payée, jamais imprimée)", async () => {
    const { illustrerLivre } = await import("@/lib/bookPipeline");
    livreEcrit("commande");
    monde.commandePendant = "commande";
    await illustrerLivre({ bookId: "commande", req: req(), portrait: null });
    expect(etat("commande").status).toBe("ready");
    expect((etat("commande").pages as { impressionsAValider?: { orderId: string }[] }).impressionsAValider?.[0]?.orderId).toBe("cmd1");
  });
  it("ni quand le livre est retenu", async () => {
    const { illustrerLivre } = await import("@/lib/bookPipeline");
    livreEcrit("commande2");
    monde.vision = "double";
    monde.commandePendant = "commande2";
    await illustrerLivre({ bookId: "commande2", req: req(), portrait: null });
    expect(etat("commande2").status).toBe("draft");
    expect((etat("commande2").pages as { impressionsAValider?: { orderId: string }[] }).impressionsAValider?.[0]?.orderId).toBe("cmd1");
  });
});

describe("Après l'achat d'un aperçu", () => {
  it("les pages restantes sont dessinées et vérifiées : le livre complet reste « prêt »", async () => {
    const { illustrerLivre } = await import("@/lib/bookPipeline");
    const { debloquerLivre } = await import("@/lib/apercu");
    livreEcrit("achat", true);
    await illustrerLivre({ bookId: "achat", req: req(true), portrait: null });
    expect(etat("achat").status).toBe("ready");
    monde.emails.length = 0;
    await debloquerLivre("achat");
    expect(etat("achat").status).toBe("ready");
    const p = pagesDe("achat");
    expect(p.apercu).toBe(false);
    expect(p.pages.every((x) => x.imageUrl)).toBe(true);
    expect(p.controleImages).toMatchObject({ verifiees: 5, nonVerifiees: 0 });
    expect(monde.alertes).toEqual([]);
  });

  it("une page dessinée après l'achat reste fautive : le livre acheté est retenu, pas remis tel quel", async () => {
    const { illustrerLivre } = await import("@/lib/bookPipeline");
    const { debloquerLivre } = await import("@/lib/apercu");
    livreEcrit("achat2", true);
    await illustrerLivre({ bookId: "achat2", req: req(true), portrait: null });
    monde.vision = "double";
    await debloquerLivre("achat2");
    expect(etat("achat2").status).toBe("draft");
    expect(monde.alertes.join(" ")).toContain("retenu");
  });
});
