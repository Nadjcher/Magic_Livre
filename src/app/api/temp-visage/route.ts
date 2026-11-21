/** TEMPORAIRE — essai de la retouche du site avec la vraie photo (une image). Protégé par secret. À supprimer après l'essai. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { retoucherPlanche } from "@/lib/illustration";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { autresPersonnages, doudouDesPlanches, histoireParId, lirePlanches, lireRef } from "@/lib/planches";
import { depensesRecentes } from "@/lib/budget";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const h = histoireParId("maitresse-petit-poucet")!;
  const m = await lirePlanches(h.id, "anim3d");
  const planche = await lireRef(m.get("p2")?.url);
  const fiche = await lireRef(m.get("fiche:enfant")?.url);
  const photoUrl = await fetchAsDataUrl(`${u.origin}/exemple/photo.webp`, { maxPx: 1024, quality: 90 });
  const mm = photoUrl ? /^data:([^;]+);base64,(.+)$/.exec(photoUrl) : null;
  if (!planche || !fiche || !mm) return NextResponse.json({ err: "planche, fiche ou photo introuvable" });
  const r = await retoucherPlanche({
    planche,
    heros: fiche,
    photo: { mime: mm[1]!, base64: mm[2]! },
    garder: autresPersonnages(h, 1).map((c) => `${c.nom} (${c.description})`),
    doudouAvant: doudouDesPlanches(h),
    seed: 4242,
  });
  return NextResponse.json({
    erreur: r.error,
    image: r.base64 ? `data:${r.mime ?? "image/jpeg"};base64,${r.base64}` : null,
    depenses: (await depensesRecentes())[0],
  });
}
