/**
 * Diagnostic de santé (temporaire) : vérifie la base, les colonnes récentes et
 * la présence des variables d'environnement — SANS jamais exposer de secret
 * (uniquement des booléens et l'URL publique). À retirer une fois le site stable.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/appUrl";
import { env } from "@/lib/env";
import { generateIllustration, illustrationsEnabled } from "@/lib/illustration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  // Test optionnel de génération d'image : /api/health?img=standard | premium | both
  const img = new URL(req.url).searchParams.get("img");
  if (img) {
    out.images = {
      provider: env.imageProvider(),
      enabled: illustrationsEnabled(),
      standardModel: env.geminiImageModel(),
      premiumModel: env.geminiImageModelPremium(),
      faceProvider: env.faceProvider(),
      falKeyPresent: Boolean(env.falApiKey()),
    };
    const scene = "a small friendly cat sitting in grass";
    if (img === "standard" || img === "1" || img === "both") {
      try {
        const r = await generateIllustration({ style: "feerique", scene, premium: false, seed: 1 });
        out.images.standardOk = r.imageUrl !== null;
      } catch {
        out.images.standardOk = false;
      }
    }
    if (img === "premium" || img === "both") {
      try {
        const r = await generateIllustration({ style: "feerique", scene, premium: true, seed: 2 });
        out.images.premiumOk = r.imageUrl !== null;
      } catch {
        out.images.premiumOk = false;
      }
    }
  }

  return NextResponse.json(out, { status: out.ok ? 200 : 500 });
}
