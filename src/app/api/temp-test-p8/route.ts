/** TEMPORAIRE — page 8 du Petit Poucet, 3 tirages, avec les fiches du test précédent. Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { storySchema } from "@/lib/storySchema";
import { maitressePour } from "@/lib/histoiresMaitresses";
import { histoireDepuisMaitresse } from "@/lib/maitresseGenerateur";
import { generateIllustration } from "@/lib/illustration";
import { fichesPresentes } from "@/lib/storyGenerator";
import type { StoryRequest } from "@/lib/storyPrompt";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { heros: string; pompon: string; poucet: string };
  const r = {
    childFirstName: "Léo",
    childAge: 5,
    mode: "theme",
    themeId: "petit-poucet",
    longueur: "moyenne",
    style: "anim3d",
    appearance: "a 5-year-old boy with short wavy chestnut-brown hair, big brown eyes, light skin with a few freckles",
    apercu: false,
    genre: "garcon",
    extras: [{ name: "Pompon", role: "doudou", appearance: "un lapin en peluche gris clair aux longues oreilles roses" }],
  } as StoryRequest;
  const story = storySchema.parse(JSON.parse(JSON.stringify(await histoireDepuisMaitresse(maitressePour("petit-poucet", 5)!, r))));
  const fiches = new Map([
    ["Pompon", { base64: b.pompon, mime: "image/jpeg" }],
    ["Poucet", { base64: b.poucet, mime: "image/jpeg" }],
  ]);
  const p = story.pages[7]!;
  const tirages = await Promise.all(
    [0, 1, 2].map((k) =>
      generateIllustration({
        style: "anim3d",
        heroName: "Léo",
        appearance: r.appearance,
        recurringCharacters: story.personnages,
        scene: p.scene_illustration,
        anchorImage: { base64: b.heros, mime: "image/jpeg" },
        castRefs: fichesPresentes(p, fiches),
        seed: 5100 + k,
        stocker: false,
      }).then((x) => ({ err: x.error ?? null, image: x.base64 ? `data:${x.mime ?? "image/jpeg"};base64,${x.base64}` : null })),
    ),
  );
  return NextResponse.json({ regles: (story.personnages ?? "").includes("STORY RULES"), longueur: (story.personnages ?? "").length, tirages });
}
