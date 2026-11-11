/** TEMPORAIRE — conte de test : écriture (1 appel) puis relecture, en deux étapes. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateStory, relireHistoire } from "@/lib/storyGenerator";
import { depenseDuJour } from "@/lib/budget";
import type { Story } from "@/lib/storySchema";
import type { StoryRequest } from "@/lib/storyPrompt";
export const runtime = "nodejs";
export const maxDuration = 300;
const DEMANDE: StoryRequest = {
  childFirstName: "Léa",
  childAge: 5,
  mode: "libre",
  prompt: "Léa entre dans le vieux livre de contes de son papa et répare le chemin de cailloux du Petit Poucet.",
  longueur: "moyenne",
  format: "album",
  style: "feerique",
  trameId: "depart:trame-conte-petit-poucet-v2",
  parent: "Papa",
  fiche: { objet: "son lapin Pompon" },
};
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { etape?: string; story?: Story };
  const t = Date.now();
  if (b.etape === "relire") {
    if (!b.story) return NextResponse.json({ erreur: "histoire manquante" }, { status: 400 });
    const relue = await relireHistoire(b.story, DEMANDE);
    return NextResponse.json({ ms: Date.now() - t, depense: await depenseDuJour(), story: relue });
  }
  if (b.etape !== "ecrire") return NextResponse.json({ erreur: "étape inconnue" }, { status: 400 });
  const r = await generateStory(DEMANDE, { illustrer: false, relire: false });
  return NextResponse.json({ ms: Date.now() - t, depense: await depenseDuJour(), ...(r.ok ? { story: r.story } : { erreur: r.message }) });
}
