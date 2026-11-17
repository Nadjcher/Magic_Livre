/** TEMPORAIRE — planche de couverture candidate (clé à part, sans toucher la couverture en service). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { CONSIGNE_COUVERTURE } from "@/lib/bibleVisuelle";
import { generateIllustration } from "@/lib/illustration";
import { construireLivre } from "@/lib/maitresseGenerateur";
import { consoliderFiche } from "@/lib/ficheHistoire";
import { remplir } from "@/lib/histoiresMaitresses";
import { APPARENCE_NEUTRE, enregistrer, etatPlanches, histoireParId, lirePlanches, lireRef, persoNeutre, validerPlanche } from "@/lib/planches";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { depensesRecentes } from "@/lib/budget";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { scene?: string; seed?: number; action?: string };
  const h = histoireParId("maitresse-petit-poucet")!;
  if (b.action === "mettreEnService") {
    const m0 = await lirePlanches(h.id, "anim3d");
    const url = m0.get("couverture:candidat")?.url;
    if (!url) return NextResponse.json({ err: "pas de candidate" });
    await enregistrer(h.id, "anim3d", "couverture", url);
    await validerPlanche(h.id, "anim3d", "couverture", true);
    const e = await etatPlanches(h, "anim3d");
    return NextResponse.json({ ok: true, validees: e.validees, total: e.total });
  }
  const p = persoNeutre("homme", h);
  const livre = consoliderFiche(construireLivre(h, p, { style: "anim3d", age: 5 }));
  const m = await lirePlanches(h.id, "anim3d");
  const ancre = await lireRef(m.get("fiche:enfant")?.url);
  const refs = [];
  for (const nom of ["Doudou", "Poucet"]) {
    const r = await lireRef(m.get(`fiche:${nom}`)?.url);
    if (r) refs.push({ name: nom, ...r });
  }
  const scene = `Book cover illustration for the story "${livre.titre}": ${remplir(b.scene ?? "", { ...p, doudou: "Doudou" }, h)}. ${CONSIGNE_COUVERTURE}`;
  const r = await generateIllustration({
    style: "anim3d",
    heroName: "the child",
    appearance: APPARENCE_NEUTRE,
    carre: true,
    recurringCharacters: livre.personnages,
    scene,
    anchorImage: ancre ?? undefined,
    castRefs: refs,
    seed: b.seed ?? 1,
  });
  if (!r.imageUrl) return NextResponse.json({ err: r.error });
  await enregistrer(h.id, "anim3d", "couverture:candidat", r.imageUrl);
  return NextResponse.json({ image: await fetchAsDataUrl(r.imageUrl, { maxPx: 900, quality: 86 }), depenses: (await depensesRecentes())[0] });
}
