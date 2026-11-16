/** TEMPORAIRE — test de cohérence des personnages (fiches doudou + Poucet, 3 pages de la forêt). Protégé. À supprimer. */
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
  const { heros } = (await req.json()) as { heros: string };
  const r: StoryRequest = {
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
  const brute = await histoireDepuisMaitresse(maitressePour("petit-poucet", 5)!, r);
  // Aller-retour par le schéma, comme en production (c'est là que la distribution disparaissait).
  const story = storySchema.parse(JSON.parse(JSON.stringify(brute)));
  const cast = (story.cast ?? []).slice(0, 4);
  const commun = { style: "anim3d" as const, heroName: "Léo", appearance: r.appearance, recurringCharacters: story.personnages, stocker: false };
  const fichesCast = await Promise.all(
    cast.map((c, k) =>
      generateIllustration({
        ...commun,
        heroName: undefined,
        appearance: undefined,
        scene: `Character model sheet of ${c.nom}: ${c.visuel}. Full body, front view, alone, plain soft light background, nothing else, no text or letters. The species must be unmistakable at first glance.`,
        seed: 4600 + k,
      }),
    ),
  );
  const fiches = new Map<string, { base64: string; mime: string }>();
  fichesCast.forEach((f, k) => {
    if (f.base64) fiches.set(cast[k]!.nom, { base64: f.base64, mime: f.mime ?? "image/jpeg" });
  });
  const ancre = { base64: heros, mime: "image/jpeg" };
  const pages = await Promise.all(
    [3, 4, 7].map((i) => {
      const p = story.pages[i]!;
      return generateIllustration({ ...commun, scene: p.scene_illustration, anchorImage: ancre, castRefs: fichesPresentes(p, fiches), seed: 4700 + i }).then((x) => ({
        page: i + 1,
        refs: fichesPresentes(p, fiches).map((c) => c.name),
        err: x.error ?? null,
        image: x.base64 ? `data:${x.mime ?? "image/jpeg"};base64,${x.base64}` : null,
      }));
    }),
  );
  return NextResponse.json({
    cast: cast.map((c) => ({ nom: c.nom, visuel: c.visuel.slice(0, 160) })),
    fiches: fichesCast.map((f, k) => ({ nom: cast[k]?.nom, err: f.error ?? null, image: f.base64 ? `data:${f.mime ?? "image/jpeg"};base64,${f.base64}` : null })),
    pages,
  });
}
