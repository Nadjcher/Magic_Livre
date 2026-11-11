/** TEMPORAIRE — banc d'essai de l'écriture (texte seul, sans images). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateStory, relireHistoire } from "@/lib/storyGenerator";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/storyPrompt";
import { blocModeles, exemplesPour } from "@/lib/bibliotheque";
import { env } from "@/lib/env";
import type { Story } from "@/lib/storySchema";
import { depenseDuJour } from "@/lib/budget";
import type { StoryRequest } from "@/lib/storyPrompt";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { etape: "ecrire" | "relire" | "soumettre" | "resultat"; req: StoryRequest; story?: Story; modele?: string; url?: string };
  // Diagnostic : écriture envoyée dans la file d'attente de fal (sans limite de temps).
  if (b.etape === "soumettre") {
    const m = await exemplesPour({ age: b.req.childAge, format: b.req.format, themeId: b.req.themeId });
    const r = await fetch("https://queue.fal.run/openrouter/router", {
      method: "POST",
      headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: b.modele ?? "anthropic/claude-opus-5.5", system_prompt: SYSTEM_PROMPT, prompt: buildUserMessage(b.req, blocModeles(m)) + "\n\nRéponds UNIQUEMENT avec l'objet JSON demandé, sans texte autour.", reasoning: true, max_tokens: 16000 }),
    });
    return NextResponse.json(await r.json());
  }
  if (b.etape === "resultat" && b.url) {
    const r = await fetch(b.url, { headers: { Authorization: `Key ${env.falApiKey()}` } });
    return NextResponse.json(await r.json().catch(() => ({ statut: r.status })));
  }
  const t = Date.now();
  const avant = await depenseDuJour();
  if (b.etape === "relire" && !b.story) return NextResponse.json({ erreur: "histoire manquante" }, { status: 400 });
  if (b.etape === "relire" && b.story) {
    const relue = await relireHistoire(b.story, b.req);
    const apres = await depenseDuJour();
    return NextResponse.json({ ms: Date.now() - t, depenseJour: [avant.dollars, apres.dollars], story: relue });
  }
  const r = await generateStory(b.req, { illustrer: false, relire: false });
  const apres = await depenseDuJour();
  return NextResponse.json({ ms: Date.now() - t, depenseJour: [avant.dollars, apres.dollars], ...(r.ok ? { story: r.story } : { erreur: r.message }) });
}
