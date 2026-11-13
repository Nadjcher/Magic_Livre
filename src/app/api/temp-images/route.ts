/** TEMPORAIRE — page 4 du Petit Poucet + relecture, et devis Gelato avec la clé du serveur. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateIllustration } from "@/lib/illustration";
import { verifier } from "@/lib/controleIllustrations";
import { grillePour, CONSIGNE_COUVERTURE } from "@/lib/bibleVisuelle";
import { fetchAsDataUrl } from "@/lib/imageFetch";
export const runtime = "nodejs";
export const maxDuration = 300;
type Ref = { base64: string; mime: string };
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const brut = (await req.json()) as { mode?: string; uid?: string };
  if (brut.mode === "gelato") return NextResponse.json(await gelato(brut.uid));
  const b = brut as unknown as { scene: string; couverture?: boolean; titre?: string; traits: string; personnages: string; ancre: Ref; heros: Ref; cast: { name: string; base64: string; mime: string; description: string }[]; seed: number };
  const scene = b.couverture ? `Book cover illustration for the story "${b.titre}": ${b.scene}. ${CONSIGNE_COUVERTURE}` : b.scene;
  const r = await generateIllustration({ style: "anim3d", scene, heroName: "Léo", appearance: b.traits, recurringCharacters: b.personnages, anchorImage: b.ancre, castRefs: b.cast.map(({ name, base64, mime }) => ({ name, base64, mime })), seed: b.seed, stocker: false });
  if (!r.base64) return NextResponse.json({ err: r.error });
  const page = { base64: r.base64, mime: r.mime ?? "image/jpeg" };
  const petit = await fetchAsDataUrl(`data:${page.mime};base64,${page.base64}`, { maxPx: 768, quality: 80 });
  const m = /^data:([^;]+);base64,(.+)$/.exec(petit ?? "");
  const v = await verifier({ nom: "Léo", description: b.personnages.slice(0, 220), image: b.heros }, b.cast.map((c) => ({ nom: c.name, description: c.description, image: { base64: c.base64, mime: c.mime } })), m ? { mime: m[1]!, base64: m[2]! } : page, b.scene, grillePour("anim3d"));
  return NextResponse.json({ image: `data:${page.mime};base64,${page.base64}`, verdict: v });
}

/** Catalogue et devis Gelato avec la clé du serveur (jamais renvoyée). */
async function gelato(uid?: string): Promise<unknown> {
  const cle = process.env.GELATO_API_KEY ?? "";
  if (!cle) return { err: "GELATO_API_KEY absente sur le serveur" };
  const h = { "X-API-KEY": cle, "Content-Type": "application/json" };
  const lire = async (url: string, init?: RequestInit) => {
    const r = await fetch(url, { ...init, headers: h, signal: AbortSignal.timeout(30_000) });
    const t = await r.text();
    return { status: r.status, corps: t.slice(0, 8000) };
  };
  const catalogues = await lire("https://product.gelatoapis.com/v3/catalogs");
  let produits: unknown = null;
  try {
    const liste = JSON.parse(catalogues.corps) as { catalogUid?: string }[] | { data?: { catalogUid?: string }[] };
    const tous = Array.isArray(liste) ? liste : (liste.data ?? []);
    const livres = tous.filter((c) => /photo.?book/i.test(c.catalogUid ?? ""));
    produits = await Promise.all(
      livres.map(async (c) => ({
        catalogue: c.catalogUid,
        r: await lire(`https://product.gelatoapis.com/v3/catalogs/${c.catalogUid}/products:search`, { method: "POST", body: JSON.stringify({ limit: 100, offset: 0 }) }),
      })),
    );
  } catch (e) {
    produits = String(e);
  }
  const actuel =
    process.env.GELATO_PRODUCT_UID ||
    "photobooks-hardcover_pf_210x280-mm-8x11-inch_pt_170-gsm-65lb-coated-silk_cl_4-4_ccl_4-4_bt_glued-left_ct_matt-lamination_prt_1-0_cpt_130-gsm-65-lb-cover-coated-silk_hor";
  const prix = async (p: string) => lire(`https://product.gelatoapis.com/v3/products/${p}/prices?country=FR&currency=EUR&pageCount=30`);
  const devis = async (p: string) =>
    lire("https://order.gelatoapis.com/v4/orders:quote", {
      method: "POST",
      body: JSON.stringify({
        orderReferenceId: "devis-test",
        customerReferenceId: "devis-test",
        currency: "EUR",
        recipient: { country: "FR", firstName: "Test", lastName: "Devis", addressLine1: "1 rue de Rivoli", city: "Paris", postCode: "75001", email: "devis@example.com" },
        products: [{ itemReferenceId: "1", productUid: p, quantity: 1, pageCount: 30 }],
      }),
    });
  return {
    catalogues: catalogues.corps.slice(0, 2000),
    produits,
    actuel: { uid: actuel, prix: await prix(actuel), devis: await devis(actuel) },
    demande: uid ? { uid, prix: await prix(uid), devis: await devis(uid) } : null,
  };
}
