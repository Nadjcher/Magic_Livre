/**
 * Livre imprimé : fabrication du fichier haute définition et commande
 * automatique chez l'imprimeur Gelato (impression + expédition au client).
 *
 * Prudence par défaut : GELATO_MODE=draft (valeur par défaut) crée la commande
 * en BROUILLON chez Gelato — rien n'est imprimé ni facturé tant que vous ne la
 * validez pas dans votre tableau de bord Gelato. GELATO_MODE=order envoie
 * directement en production.
 */

import "server-only";
import sharp from "sharp";
import { prisma } from "./prisma";
import { env } from "./env";
import { noterDepense } from "./budget";
import { getStripe } from "./stripe";
import { fetchAsDataUrl } from "./imageFetch";
import { storySchema, type Story } from "./storySchema";
import { renderPrintPdf, PAGES_INTERIEURES, PRODUIT_GELATO_CARRE, type ImagesImpression } from "./printBook";
import { alerterAdmin } from "./notifications";
import { emailAvecBouton } from "./mailer";
import { getAppUrl } from "./appUrl";
import { falFetch } from "./jetonsFal";

export const PRODUIT_GELATO = () =>
  process.env.GELATO_PRODUCT_UID || PRODUIT_GELATO_CARRE;
const modeGelato = () => (process.env.GELATO_MODE === "order" ? "order" : "draft");
const cleGelato = () => process.env.GELATO_API_KEY ?? "";

export function impressionConfiguree(): boolean {
  return Boolean(cleGelato());
}

/** Agrandit une illustration pour l'impression (≈ 3 400 px de large). Repli : l'image d'origine. */
export async function agrandir(dataUrl: string | null): Promise<string | null> {
  if (!dataUrl || !env.falApiKey()) return dataUrl;
  try {
    const r = await falFetch("https://fal.run/fal-ai/esrgan", {
      method: "POST",
      headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: dataUrl, model: "RealESRGAN_x4plus_anime_6B", scale: 2.5, output_format: "jpeg" }),
    }, 90_000);
    const j = (await r.json()) as { image?: { url?: string } };
    if (r.ok) await noterDepense(0.01);
    if (!r.ok || !j.image?.url) return dataUrl;
    const grand = await fetchAsDataUrl(j.image.url);
    if (!grand) return dataUrl;
    // JPEG haute qualité, 3 400 px max (≈ 300 dpi sur 28 cm).
    const b = await sharp(Buffer.from(grand.split(",")[1] as string, "base64"))
      .resize({ width: 3400, height: 3400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    return `data:image/jpeg;base64,${b.toString("base64")}`;
  } catch {
    return dataUrl;
  }
}

/** Rassemble les images du livre (agrandies pour l'impression si `hd`). */
export async function imagesDuLivre(story: Story, prenom: string, hd: boolean): Promise<ImagesImpression> {
  const q = hd ? undefined : { maxPx: 1100, quality: 72 };
  const lire = (u: string | null | undefined) => fetchAsDataUrl(u, q ?? { maxPx: 2000, quality: 92 });
  const prep = async (u: string | null | undefined) => {
    const d = await lire(u);
    return hd ? agrandir(d) : d;
  };
  // 3 agrandissements à la fois (le service limite les requêtes simultanées).
  const pages: (string | null)[] = new Array(story.pages.length).fill(null);
  let next = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (next < story.pages.length) {
        const i = next++;
        pages[i] = await prep(story.pages[i]?.imageUrl);
      }
    }),
  );
  const couverture = await prep(story.couvertureUrl);
  const personnages: { nom: string; image: string }[] = [];
  const heros = await lire(story.fiches?.heros);
  if (heros) personnages.push({ nom: prenom, image: heros });
  for (const [nom, url] of Object.entries(story.fiches?.cast ?? {})) {
    const img = await lire(url);
    if (img) personnages.push({ nom, image: img });
  }
  return { couverture, pages, personnages };
}

/** Dépose le PDF sur le stockage public de fal (l'imprimeur doit pouvoir le télécharger). */
export async function deposerPdf(pdf: Buffer, nom: string): Promise<string> {
  const init = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3", {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: "application/pdf", file_name: nom }),
  });
  const j = (await init.json()) as { upload_url?: string; file_url?: string };
  if (!init.ok || !j.upload_url || !j.file_url) throw new Error(`dépôt refusé (${init.status})`);
  const put = await fetch(j.upload_url, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: new Uint8Array(pdf) });
  if (!put.ok) throw new Error(`envoi du fichier refusé (${put.status})`);
  return j.file_url;
}

export type Adresse = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postCode: string;
  state?: string;
  country: string;
  email: string;
  phone?: string;
};

/** Crée la commande chez Gelato. Renvoie l'identifiant de commande Gelato. */
export async function commanderGelato(orderId: string, userId: string, fichier: string, adresse: Adresse): Promise<string> {
  const r = await fetch("https://order.gelatoapis.com/v4/orders", {
    method: "POST",
    headers: { "X-API-KEY": cleGelato(), "Content-Type": "application/json" },
    body: JSON.stringify({
      orderType: modeGelato(),
      orderReferenceId: orderId,
      customerReferenceId: userId,
      currency: "EUR",
      items: [
        {
          itemReferenceId: orderId,
          productUid: PRODUIT_GELATO(),
          pageCount: PAGES_INTERIEURES,
          files: [{ type: "default", url: fichier }],
          quantity: 1,
        },
      ],
      shippingAddress: adresse,
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { id?: string; message?: string; details?: unknown };
  if (!r.ok || !j.id) throw new Error(`Gelato a refusé la commande (${r.status}) ${JSON.stringify(j.details ?? j.message ?? j).slice(0, 200)}`);
  return j.id;
}

/** Statut d'une commande Gelato (pour « Mon compte »). */
export async function suiviGelato(id: string): Promise<{ statut: string; suivi?: string } | null> {
  if (!cleGelato()) return null;
  try {
    const r = await fetch(`https://order.gelatoapis.com/v4/orders/${id}`, { headers: { "X-API-KEY": cleGelato() } });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      fulfillmentStatus?: string;
      orderType?: string;
      shipment?: { packages?: { trackingUrl?: string }[] };
      items?: { fulfillments?: { trackingUrl?: string }[] }[];
    };
    const suivi = j.shipment?.packages?.[0]?.trackingUrl ?? j.items?.[0]?.fulfillments?.[0]?.trackingUrl;
    return { statut: j.orderType === "draft" ? "draft" : j.fulfillmentStatus ?? "created", suivi };
  } catch {
    return null;
  }
}

/** Libellé lisible d'un statut Gelato. */
export function libelleStatut(statut: string): string {
  const t: Record<string, string> = {
    draft: "Validation en cours",
    created: "Commande reçue",
    passed: "Commande reçue",
    pending_approval: "Validation en cours",
    printed: "Imprimé",
    in_production: "En impression",
    shipped: "Expédié",
    delivered: "Livré",
    canceled: "Annulé",
    failed: "Problème d'impression : nous vous recontactons",
  };
  return t[statut] ?? "En préparation";
}

/**
 * Après paiement d'un livre imprimé : fichier HD, dépôt, commande Gelato, et
 * enregistrement sur le livre. Ne jette jamais ; alerte l'administrateur en cas
 * de problème (la commande reste payée et peut être relancée).
 */
export async function lancerImpression(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, bookId: true, stripeSessionId: true, user: { select: { email: true } } },
    });
    if (!order?.stripeSessionId) throw new Error("commande sans session de paiement");
    if (!impressionConfiguree()) throw new Error("GELATO_API_KEY absente");
    const book = await prisma.book.findUnique({
      where: { id: order.bookId },
      select: { pages: true, child: { select: { firstName: true } } },
    });
    const parsed = storySchema.safeParse(book?.pages);
    if (!book || !parsed.success) throw new Error("livre illisible");
    if (parsed.data.impressions?.some((i) => i.orderId === orderId)) return; // déjà lancée

    // Adresse saisie par le client sur la page de paiement.
    const session = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
    const exp = session.shipping_details;
    const a = exp?.address;
    if (!exp?.name || !a?.line1 || !a.city || !a.postal_code || !a.country) throw new Error("adresse de livraison manquante");
    const [prenom, ...reste] = exp.name.trim().split(/\s+/);
    const adresse: Adresse = {
      firstName: prenom ?? exp.name,
      lastName: reste.join(" ") || prenom || exp.name,
      addressLine1: a.line1,
      addressLine2: a.line2 ?? undefined,
      city: a.city,
      postCode: a.postal_code,
      state: a.state ?? undefined,
      country: a.country,
      email: session.customer_details?.email ?? order.user.email,
      phone: session.customer_details?.phone ?? undefined,
    };

    const images = await imagesDuLivre(parsed.data, book.child.firstName, true);
    const pdf = await renderPrintPdf(parsed.data, book.child.firstName, images);
    const fichier = await deposerPdf(pdf, `encoreunehistoire-${orderId}.pdf`);
    const gelatoId = await commanderGelato(orderId, order.userId, fichier, adresse);

    // Enregistre la commande d'impression sur le livre (relu juste avant).
    const frais = await prisma.book.findUnique({ where: { id: order.bookId }, select: { pages: true } });
    const p = storySchema.safeParse(frais?.pages);
    if (p.success) {
      const maj: Story = {
        ...p.data,
        impressions: [...(p.data.impressions ?? []), { orderId, gelatoId, creeLe: Date.now() }],
      };
      await prisma.book.update({ where: { id: order.bookId }, data: { pages: maj } });
    }

    if (modeGelato() === "draft") {
      await alerterAdmin(
        "livre imprimé à valider",
        `Une commande de livre imprimé attend votre validation dans Gelato (brouillon ${gelatoId}). Vérifiez l'aperçu puis confirmez la commande.`,
      );
    }
    await emailAvecBouton(
      adresse.email,
      "Votre livre imprimé est en préparation 📦",
      "Votre livre part à l'impression",
      "Merci ! Votre livre relié est en préparation chez notre imprimeur. Comptez environ 7 à 12 jours pour la livraison. Vous pouvez suivre la commande depuis votre compte.",
      `${getAppUrl()}/compte`,
      "Suivre ma commande",
    );
  } catch (e) {
    await alerterAdmin("échec d'une commande de livre imprimé", `Commande ${orderId} : ${String(e).slice(0, 300)}`);
  }
}
