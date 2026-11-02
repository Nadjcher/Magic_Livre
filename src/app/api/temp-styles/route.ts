/** TEMPORAIRE — aperçus de styles par âge. Protégé par empreinte de secret. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { findAgeGroup } from "@/lib/ageGroups";
import { ILLUSTRATION_STYLES, BASE_IMAGE_PROMPT } from "@/lib/style_config";
export const runtime = "nodejs";
export const maxDuration = 300;
const DECORS: Record<string, string> = {
  "bebe-1-2-ans": "in a cozy pastel bedroom at bedtime, soft night light, toys around",
  "3-4-ans": "in a lush prehistoric jungle with giant ferns and a sleeping volcano, splashing in a puddle",
  "5-6-ans": "exploring an enchanted forest path with glowing mushrooms, holding a little lantern",
  "7-8-ans": "skateboarding in a colorful city park at sunset, the robot rolling beside him",
  "9-12-ans": "investigating a clue in a grand old library with tall bookshelves and warm lamps",
};
export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "2ae9e1fc152080f632e29edd248193caae9a5e8fb84e9cd261e0ca4ba8de0a4c") return new NextResponse("Non.", { status: 404 });
  const g = findAgeGroup(u.searchParams.get("g") ?? "");
  if (!g) return NextResponse.json({ erreur: "groupe" });
  const out = await Promise.all(g.styles.map(async (st) => {
    const prompt = `${ILLUSTRATION_STYLES[st].prompt}. Scene: ${g.heros}, ${DECORS[g.slug]}, full body, joyful expressive moment. ${BASE_IMAGE_PROMPT}`;
    const r = await fetch("https://fal.run/fal-ai/flux-2-pro", {
      method: "POST", headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, image_size: "landscape_4_3", output_format: "jpeg" }), signal: AbortSignal.timeout(200_000),
    });
    const j = (await r.json()) as { images?: { url: string }[] };
    return { style: st, url: j.images?.[0]?.url ?? null, err: r.ok ? null : JSON.stringify(j).slice(0, 200) };
  }));
  return NextResponse.json(out);
}
