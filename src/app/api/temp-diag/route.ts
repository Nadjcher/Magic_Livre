/** TEMPORAIRE — diagnostic du service d'images (fal). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const t = Date.now();
  const r = await fetch(`https://fal.run/${env.falImageModel().replace(/\/edit$/, "")}`, {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "a small red apple on a table, children's book illustration", aspect_ratio: "1:1" }),
    signal: AbortSignal.timeout(100_000),
  });
  const j = await r.json().catch(() => ({}));
  return NextResponse.json({ modele: env.falImageModel(), premium: env.falImageModelPremium(), status: r.status, ms: Date.now() - t, detail: r.ok ? "ok" : JSON.stringify(j).slice(0, 400) });
}
