/**
 * Diagnostic de santé (temporaire) : vérifie la base, les colonnes récentes et
 * la présence des variables d'environnement — SANS jamais exposer de secret
 * (uniquement des booléens et l'URL publique). À retirer une fois le site stable.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/appUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function present(name: string): boolean {
  return Boolean((process.env[name] ?? "").trim());
}

export async function GET(): Promise<Response> {
  const out: {
    ok: boolean;
    appUrl: string;
    env: Record<string, unknown>;
    db: Record<string, boolean>;
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

  try {
    await prisma.$queryRaw`SELECT 1`;
    out.db.connect = true;
  } catch (e) {
    out.db.connect = false;
    out.ok = false;
    out.errors.push("db_connect: " + String((e as Error)?.message ?? e).slice(0, 200));
  }

  try {
    await prisma.book.findFirst({ select: { id: true, tier: true } });
    out.db.bookTier = true;
  } catch (e) {
    out.db.bookTier = false;
    out.ok = false;
    out.errors.push("book.tier: " + String((e as Error)?.message ?? e).slice(0, 200));
  }

  try {
    await prisma.order.findFirst({ select: { id: true, sku: true } });
    out.db.orderSku = true;
  } catch (e) {
    out.db.orderSku = false;
    out.ok = false;
    out.errors.push("order.sku: " + String((e as Error)?.message ?? e).slice(0, 200));
  }

  return NextResponse.json(out, { status: out.ok ? 200 : 500 });
}
