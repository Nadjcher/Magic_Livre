/** TEMPORAIRE — écrit UN conte de test (texte seul, un appel, sans relecture). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateStory } from "@/lib/storyGenerator";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "03902131a32cfa92b9e3f1ba1f0db77116f66fac69cb6810395682dd10c1d393") return new NextResponse("Non.", { status: 404 });
  const r = await generateStory(
    {
      childFirstName: "Léa",
      childAge: 5,
      mode: "libre",
      prompt: "Léa entre dans le vieux livre de contes de son papa et aide le Petit Poucet à retrouver le chemin de la maison.",
      longueur: "moyenne",
      format: "album",
      style: "feerique",
      trameId: "depart:trame-conte-petit-poucet",
      fiche: { objet: "sa lampe de poche en forme de hibou", proches: "son papa" },
    },
    { illustrer: false, relire: false },
  );
  return NextResponse.json(r.ok ? { story: r.story } : { erreur: r.message });
}
