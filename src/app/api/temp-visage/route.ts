/** TEMPORAIRE — essai du remplacement de visage (une image). Protégé par secret. À supprimer après l'essai. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { falFetch } from "@/lib/jetonsFal";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { lirePlanches } from "@/lib/planches";
import { depensesRecentes, noterDepense } from "@/lib/budget";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { action: "info" | "essai"; ids?: string[]; endpoint?: string; corps?: Record<string, unknown>; prix?: number };
  const key = env.falApiKey();

  // Fiches officielles (schéma, prix) des modèles : gratuit.
  if (b.action === "info") {
    const q = (b.ids ?? []).map((id) => `endpoint_id=${encodeURIComponent(id)}`).join("&");
    const [modeles, prix] = await Promise.all([
      fetch(`https://api.fal.ai/v1/models?${q}&expand=openapi-3.0`, { headers: { Authorization: `Key ${key}` } }).then(async (r) => ({ status: r.status, j: await r.json().catch(() => null) })),
      fetch(`https://api.fal.ai/v1/models/pricing?${q}`, { headers: { Authorization: `Key ${key}` } }).then(async (r) => ({ status: r.status, j: await r.json().catch(() => null) })),
    ]);
    return NextResponse.json({ modeles, prix });
  }

  // Un essai : la planche p2 du Petit Poucet (enfant neutre) et la photo d'exemple du site (Léo).
  const m = await lirePlanches("maitresse-petit-poucet", "anim3d");
  const planche = await fetchAsDataUrl(m.get(String(u.searchParams.get("c") || "p2"))?.url, { maxPx: 1024, quality: 90 });
  const photo = await fetchAsDataUrl(`${u.origin}/exemple/photo.webp`, { maxPx: 1024, quality: 90 });
  if (!planche || !photo) return NextResponse.json({ err: "planche ou photo introuvable" });
  const corps = JSON.parse(JSON.stringify(b.corps ?? {}).replaceAll("$PLANCHE", planche).replaceAll("$PHOTO", photo)) as Record<string, unknown>;
  const r = await falFetch(`https://fal.run/${b.endpoint}`, { method: "POST", headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(corps) }, 200_000);
  const j = (await r.json().catch(() => ({}))) as { image?: { url?: string }; images?: { url?: string }[] };
  if (r.ok) await noterDepense(b.prix ?? 0.05);
  const url = j.image?.url ?? j.images?.[0]?.url;
  return NextResponse.json({
    status: r.status,
    erreur: r.ok ? undefined : JSON.stringify(j).slice(0, 600),
    image: url ? await fetchAsDataUrl(url, { maxPx: 900, quality: 88 }) : null,
    planche: await fetchAsDataUrl(planche, { maxPx: 900, quality: 88 }),
    depenses: (await depensesRecentes())[0],
  });
}
