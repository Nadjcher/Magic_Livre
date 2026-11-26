/** TEMPORAIRE — comparatif des deux dessinateurs sur la ressemblance (photo d'exemple du site : un portrait et une page chacun). Protégé par secret. À supprimer après l'essai. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateIllustration, retoucherPlanche } from "@/lib/illustration";
import { compressImage } from "@/lib/blobStore";
import { env } from "@/lib/env";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { autresPersonnages, doudouDesPlanches, histoireParId, lirePlanches, lireRef } from "@/lib/planches";
import { depensesRecentes } from "@/lib/budget";

export const runtime = "nodejs";
export const maxDuration = 300;

type Img = { base64: string; mime: string };
const petit = async (i: Img | null) => {
  if (!i) return null;
  const c = await compressImage(Buffer.from(i.base64, "base64"), i.mime, { maxPx: 900, quality: 82 });
  return `data:${c.mime};base64,${c.bytes.toString("base64")}`;
};

export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const h = histoireParId("maitresse-petit-poucet")!;
  const m = await lirePlanches(h.id, "anim3d");
  const planche = await lireRef(m.get("p2")?.url);
  const photoUrl = await fetchAsDataUrl(`${u.origin}/exemple/photo.webp`, { maxPx: 1024, quality: 90 });
  const mm = photoUrl ? /^data:([^;]+);base64,(.+)$/.exec(photoUrl) : null;
  if (!planche || !mm) return NextResponse.json({ err: "planche ou photo introuvable" });
  const photo = { mime: mm[1]!, base64: mm[2]! };

  // Même consigne, même photo, même planche, même cadrage : seul le dessinateur change.
  const essai = async (premium: boolean) => {
    const fiche = await generateIllustration({
      style: "anim3d",
      heroName: "Léo",
      appearance: "a 4-year-old boy with curly light-brown hair, brown eyes, light skin with a few freckles",
      scene:
        "Character model sheet of the hero Léo: full body, front view, standing in a friendly relaxed pose, wearing pale yellow pyjamas with small moons, " +
        "plain soft light background, nothing else, no text or letters",
      referenceImage: photo,
      premium,
      carre: true,
      stocker: false,
      seed: 4242,
    });
    const f = fiche.base64 ? { base64: fiche.base64, mime: fiche.mime ?? "image/jpeg" } : null;
    const page = f
      ? await retoucherPlanche({
          planche,
          heros: f,
          photo,
          garder: autresPersonnages(h, 1).map((c) => `${c.nom} (${c.description})`),
          doudouAvant: doudouDesPlanches(h),
          modele: premium ? env.falImageModelPremium() : undefined,
          seed: 4242,
        })
      : null;
    return {
      fiche: await petit(f),
      ficheErreur: fiche.error,
      page: await petit(page?.base64 ? { base64: page.base64, mime: page.mime ?? "image/jpeg" } : null),
      pageErreur: page?.error,
    };
  };
  const [standard, premium] = await Promise.all([essai(false), essai(true)]);
  return NextResponse.json({ standard, premium, depenses: (await depensesRecentes())[0] });
}
