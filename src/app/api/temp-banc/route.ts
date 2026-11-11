/** TEMPORAIRE — banc d'essai de l'écriture (texte seul, sans images). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateStory } from "@/lib/storyGenerator";
import { depenseDuJour } from "@/lib/budget";
import type { StoryRequest } from "@/lib/storyPrompt";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const demande = (await req.json()) as StoryRequest;
  const t = Date.now();
  const avant = await depenseDuJour();
  const r = await generateStory(demande, { illustrer: false });
  const apres = await depenseDuJour();
  return NextResponse.json({ ms: Date.now() - t, depenseJour: [avant.dollars, apres.dollars], ...(r.ok ? { story: r.story } : { erreur: r.message }) });
}
