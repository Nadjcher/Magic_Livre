/**
 * Diagnostic de santé (temporaire) : vérifie la base, les colonnes récentes et
 * la présence des variables d'environnement — SANS jamais exposer de secret
 * (uniquement des booléens et l'URL publique). À retirer une fois le site stable.
 */

import { blobMode, blobTokenName, putBlob, readPrivateBlob } from "@/lib/blobStore";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/appUrl";
import { env } from "@/lib/env";
import { illustrationsEnabled } from "@/lib/illustration";
import { requestPortrait } from "@/lib/faceIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function present(name: string): boolean {
  return Boolean((process.env[name] ?? "").trim());
}

export async function GET(req: Request): Promise<Response> {
  const out: {
    ok: boolean;
    appUrl: string;
    env: Record<string, unknown>;
    db: Record<string, boolean>;
    images?: Record<string, unknown>;
    errors: string[];
  } = {
    ok: true,
    appUrl: getAppUrl(),
    env: {
      AUTH_URL_raw: process.env.AUTH_URL ? "set" : "MISSING",
      AUTH_SECRET: present("AUTH_SECRET"),
      DATABASE_URL: present("DATABASE_URL"),
      STRIPE_SECRET_KEY: present("STRIPE_SECRET_KEY"),
      STRIPE_WEBHOOK_SECRET: present("STRIPE_WEBHOOK_SECRET"),
      GROQ_or_ANTHROPIC_KEY: present("GROQ_API_KEY") || present("ANTHROPIC_API_KEY"),
      GEMINI_API_KEY: present("GEMINI_API_KEY"),
      IMAGE_PROVIDER: process.env.IMAGE_PROVIDER ?? "(non défini → aucune image)",
    },
    db: {},
    errors: [],
  };

  // On ne renvoie que des libellés d'échec génériques (pas de message brut :
  // éviter toute fuite d'info sur la base).
  try {
    await prisma.$queryRaw`SELECT 1`;
    out.db.connect = true;
  } catch {
    out.db.connect = false;
    out.ok = false;
    out.errors.push("db_connect_failed");
  }

  try {
    await prisma.book.findFirst({ select: { id: true, tier: true } });
    out.db.bookTier = true;
  } catch {
    out.db.bookTier = false;
    out.ok = false;
    out.errors.push("book_tier_missing");
  }

  try {
    await prisma.order.findFirst({ select: { id: true, sku: true } });
    out.db.orderSku = true;
  } catch {
    out.db.orderSku = false;
    out.ok = false;
    out.errors.push("order_sku_missing");
  }

  // Stockage des livres (sans aucune donnée personnelle) : nombre, poids moyen
  // du contenu et mode de stockage des images (data URL en base ou Blob).
  try {
    const rows = await prisma.$queryRaw<
      { n: bigint; avg_kb: number | null; max_kb: number | null; data_covers: bigint }[]
    >`SELECT count(*) AS n,
             round(avg(length(pages::text)) / 1024) AS avg_kb,
             round(max(length(pages::text)) / 1024) AS max_kb,
             sum(CASE WHEN pages->>'couvertureUrl' LIKE 'data:%' THEN 1 ELSE 0 END) AS data_covers
      FROM "Book" WHERE pages IS NOT NULL`;
    const r = rows[0];
    out.env.BLOB_READ_WRITE_TOKEN = blobTokenName() ?? false;
    (out.env as Record<string, unknown>).EMAIL = Boolean(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM);
    (out.env as Record<string, unknown>).ADMIN_EMAILS = Boolean(process.env.ADMIN_EMAILS);
    (out.env as Record<string, unknown>).STRIPE_MODE = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live") ? "réel" : "test";
    (out.env as Record<string, unknown>).LEGAL = ["LEGAL_NOM", "LEGAL_SIREN", "LEGAL_ADRESSE", "LEGAL_MEDIATEUR"].filter((k) => !process.env[k]);
    (out.env as Record<string, unknown>).GELATO = process.env.GELATO_API_KEY ? process.env.GELATO_MODE === "order" ? "production" : "brouillon" : false;
    (out.env as Record<string, unknown>).blobMode = blobMode();
    (out.env as Record<string, unknown>).blobLikeVars = Object.keys(process.env).filter((k) => /BLOB|READ_WRITE/i.test(k));
    out.db.storage = true;
    (out as Record<string, unknown>).books = r
      ? { count: Number(r.n), avgKb: Number(r.avg_kb ?? 0), maxKb: Number(r.max_kb ?? 0), dataUrlCovers: Number(r.data_covers ?? 0) }
      : null;
  } catch {
    out.db.storage = false;
  }

  // Diagnostic image : /api/health?img=1 — sonde directement l'API Gemini pour
  // chaque modèle et remonte le VRAI code/message d'erreur de Google.
  // Test réel du stockage Blob : /api/health?blob=1 (dépose puis supprime un
  // petit fichier ; ne renvoie que le résultat, jamais de secret).
  if (new URL(req.url).searchParams.get("blob") === "1") {
    const probe: Record<string, unknown> = { mode: blobMode() };
    try {
      const ref = await putBlob("diagnostic/sonde.txt", Buffer.from("ok"), "text/plain");
      probe.putOk = true;
      probe.access = ref.startsWith("vblob:") ? "private" : "public";
      if (ref.startsWith("vblob:")) probe.readOk = Boolean(await readPrivateBlob(ref));
      await del(ref.replace(/^vblob:/, "")).catch(() => undefined);
    } catch (e) {
      probe.putOk = false;
      probe.error = String(e).slice(0, 300);
    }
    (out as Record<string, unknown>).blob = probe;
  }

  const img = new URL(req.url).searchParams.get("img");

  // Dernières commandes et leur statut chez Stripe (sans donnée personnelle) : /api/health?orders=1
  if (new URL(req.url).searchParams.get("orders") === "1") {
    const { getStripe } = await import("@/lib/stripe");
    const cmds = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, sku: true, status: true, createdAt: true, stripeSessionId: true } });
    (out as Record<string, unknown>).orders = await Promise.all(
      cmds.map(async (c) => {
        let stripe: Record<string, unknown> = {};
        if (c.stripeSessionId) {
          try {
            const ses = await getStripe().checkout.sessions.retrieve(c.stripeSessionId);
            stripe = { status: ses.status, payment_status: ses.payment_status, metaOk: ses.metadata?.orderId === c.id, mode: ses.livemode ? "réel" : "test" };
          } catch (e) {
            stripe = { erreur: String(e).slice(0, 160) };
          }
        }
        return { sku: c.sku, status: c.status, cree: c.createdAt, session: Boolean(c.stripeSessionId), stripe };
      }),
    );
    return NextResponse.json(out, { status: 200 });
  }

  // Test de connexion au serveur d'emails (n'envoie rien) : /api/health?mail=1
  if (new URL(req.url).searchParams.get("mail") === "1") {
    const { createTransport } = await import("nodemailer");
    const from = process.env.EMAIL_FROM ?? "";
    const info: Record<string, unknown> = {
      host: process.env.EMAIL_SERVER_HOST ?? null,
      port: process.env.EMAIL_SERVER_PORT ?? "587 (défaut)",
      userSet: Boolean(process.env.EMAIL_SERVER_USER),
      passSet: Boolean(process.env.EMAIL_SERVER_PASSWORD),
      fromDomaine: from.replace(/^.*@/, "").replace(/>.*$/, "") || null,
    };
    try {
      const t = createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
        connectionTimeout: 10_000,
      });
      await t.verify();
      info.connexion = "OK";
    } catch (e) {
      info.connexion = "ÉCHEC";
      info.erreur = String(e).replace(/pass\S*/gi, "").slice(0, 300);
    }
    (out as Record<string, unknown>).mail = info;
    return NextResponse.json(out, { status: 200 });
  }

  // Derniers livres : statut, diagnostic des images (gratuit, sans appel IA).
  try {
    const derniers = await prisma.$queryRaw<
      { status: string; err: string | null; created: Date; total: number; nulles: number; cover: string | null }[]
    >`SELECT status, left("errorMessage", 300) AS err, "createdAt" AS created,
             coalesce(jsonb_array_length(pages->'pages'), 0)::int AS total,
             (SELECT count(*) FROM jsonb_array_elements(coalesce(pages->'pages', '[]'::jsonb)) e
               WHERE e->>'imageUrl' IS NULL)::int AS nulles,
             left(pages->>'couvertureUrl', 12) AS cover
      FROM "Book" ORDER BY "createdAt" DESC LIMIT 3`;
    (out as Record<string, unknown>).derniersLivres = derniers;
  } catch (e) {
    (out as Record<string, unknown>).derniersLivres = String(e).slice(0, 120);
  }

  // Sonde Gemini à coût quasi nul (une réponse texte d'un mot) : détecte
  // crédits épuisés (402), clé refusée (403)… — /api/health?img=cheap
  // Liste des modèles accessibles à la clé (gratuit) : /api/health?img=models
  if (img === "models") {
    const key = env.geminiApiKey();
    const noms: string[] = [];
    let pageToken = "";
    for (let n = 0; n < 5; n++) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${key}${pageToken ? `&pageToken=${pageToken}` : ""}`,
      );
      const j = (await r.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[]; nextPageToken?: string };
      for (const m of j.models ?? []) noms.push(m.name.replace("models/", ""));
      if (!j.nextPageToken) break;
      pageToken = j.nextPageToken;
    }
    out.images = {
      configured: { standard: env.geminiImageModel(), premium: env.geminiImageModelPremium(), vision: env.geminiVisionModel() },
      models: noms.filter((x) => /image|flash|pro/i.test(x)),
    };
    return NextResponse.json(out, { status: 200 });
  }

  // Test du modèle d'écriture (Claude via fal) : /api/health?img=llm
  if (img === "llm") {
    const modele = process.env.STORY_MODEL || "anthropic/claude-sonnet-5.5";
    const t = Date.now();
    const r = await fetch("https://fal.run/openrouter/router", {
      method: "POST",
      headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: modele, system_prompt: "Tu es un auteur jeunesse.", prompt: "Écris UNE phrase pour un enfant de 4 ans sur un ballon qui chante.", max_tokens: 3000, reasoning: true }),
    }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }) as const);
    const brut = await r.text().catch(() => "");
    let j: { output?: string; error?: unknown } = {};
    try { j = JSON.parse(brut); } catch { j = { error: brut.slice(0, 300) }; }
    if (!r.ok && !j.error) j.error = brut.slice(0, 300);
    out.images = { modele, ok: r.ok, status: r.status, s: (Date.now() - t) / 1000, output: j.output?.slice(0, 200), error: j.error ? JSON.stringify(j.error).slice(0, 300) : undefined };
    return NextResponse.json(out, { status: 200 });
  }

  if (img === "cheap") {
    const key = env.geminiApiKey();
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Réponds juste: ok" }] }],
          generationConfig: { maxOutputTokens: 5, thinkingConfig: { thinkingBudget: 0 } },
        }),
      },
    ).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }) as const);
    out.images = {
      geminiTextOk: r.ok,
      status: r.status,
      detail: r.ok ? "" : (await r.text()).slice(0, 300),
    };
    return NextResponse.json(out, { status: 200 });
  }

  // Test réel de bout en bout du portrait fal : /api/health?img=fal
  // (génère 1 portrait avec l'image d'exemple de la doc fal : quelques centimes).
  if (img === "fal") {
    const r = await requestPortrait({
      referenceImageUrl:
        "https://storage.googleapis.com/falserverless/gallery/example_inputs_liuyifei.png",
      stylePrompt: "soft watercolor children's book illustration",
    });
    out.images = {
      faceProvider: env.faceProvider(),
      falModel: env.falFaceModel(),
      falKeyPresent: Boolean(env.falApiKey()),
      portraitOk: r.image !== null,
      status: r.status,
      seconds: Math.round(r.ms / 100) / 10,
      error: r.error,
    };
    return NextResponse.json(out, { status: 200 });
  }

  if (img) {
    out.images = {
      provider: env.imageProvider(),
      enabled: illustrationsEnabled(),
      standardModel: env.geminiImageModel(),
      premiumModel: env.geminiImageModelPremium(),
      faceProvider: env.faceProvider(),
      falKeyPresent: Boolean(env.falApiKey()),
      standard: await probeGemini(env.geminiImageModel()),
      premium: await probeGemini(env.geminiImageModelPremium()),
      fal: await probeFal(),
    };
  }

  return NextResponse.json(out, { status: out.ok ? 200 : 500 });
}

/** Sonde l'API Gemini pour un modèle d'image : renvoie le code HTTP + message. */
async function probeGemini(
  model: string,
): Promise<{ status: number; ok: boolean; error?: string }> {
  const key = env.geminiApiKey();
  if (!key) return { status: 0, ok: false, error: "GEMINI_API_KEY manquante" };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "a small friendly cat" }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      },
    );
    if (res.ok) return { status: res.status, ok: true };
    const text = await res.text();
    // On retire une éventuelle occurrence de la clé par prudence.
    const safe = text.replaceAll(key, "***").slice(0, 400);
    return { status: res.status, ok: false, error: safe };
  } catch (e) {
    return { status: -1, ok: false, error: String((e as Error)?.message ?? e).slice(0, 200) };
  }
}

/** Sonde fal : vérifie l'authentification / les crédits (sans générer d'image). */
async function probeFal(): Promise<Record<string, unknown>> {
  if (env.faceProvider() !== "fal") return { enabled: false };
  const key = env.falApiKey();
  if (!key) return { enabled: true, keyPresent: false };
  try {
    const res = await fetch(`https://fal.run/${env.falFaceModel()}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      // Sans reference_image_url : s'il manque, fal répond 422 (auth OK, pas de
      // coût). Un 402/403 révèle un souci de crédits / facturation.
      body: JSON.stringify({ prompt: "a small friendly cat" }),
    });
    const text = res.ok ? "" : (await res.text()).replaceAll(key, "***").slice(0, 300);
    return { enabled: true, keyPresent: true, status: res.status, ok: res.ok, error: text || undefined };
  } catch (e) {
    return { enabled: true, keyPresent: true, status: -1, error: String((e as Error)?.message ?? e).slice(0, 200) };
  }
}
