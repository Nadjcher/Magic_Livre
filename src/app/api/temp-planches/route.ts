/** TEMPORAIRE — dessin des planches d'une histoire et lecture de leur état. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { dessinerPlanches, effacerPlanche, etatPlanches, histoireParId, lirePlanches, validerPlanche } from "@/lib/planches";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { depensesRecentes } from "@/lib/budget";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { histoire: string; action: "dessiner" | "etat" | "images" | "valider" | "effacer"; cles?: string[] };
  const h = histoireParId(b.histoire);
  if (!h) return NextResponse.json({ err: "histoire inconnue" });
  if (b.action === "valider") for (const c of b.cles ?? []) await validerPlanche(h.id, "anim3d", c, true);
  if (b.action === "effacer") for (const c of b.cles ?? []) await effacerPlanche(h.id, "anim3d", c);
  if (b.action === "dessiner") return NextResponse.json(await dessinerPlanches(h, "anim3d", Date.now() + 260_000));
  if (b.action === "images") {
    const m = await lirePlanches(h.id, "anim3d");
    const out: Record<string, string | null> = {};
    for (const [cle, v] of m) out[cle] = await fetchAsDataUrl(v.url, { maxPx: 512, quality: 80 });
    return NextResponse.json(out);
  }
  const e = await etatPlanches(h, "anim3d");
  return NextResponse.json({ total: e.total, dessinees: e.dessinees, validees: e.validees, depenses: (await depensesRecentes())[0] });
}
