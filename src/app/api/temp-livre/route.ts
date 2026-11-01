/** TEMPORAIRE — création complète d'un livre d'essai (sans base). Protégé par empreinte de secret. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { generateStory } from "@/lib/storyGenerator";
import { fetchAsDataUrl } from "@/lib/imageFetch";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  const s = u.searchParams.get("s") ?? "";
  if (createHash("sha256").update(s).digest("hex") !== "0553dab40751e0051596bcadeaa1e59c15e9c141626e2490933feac1e37a2c3d") return new NextResponse("Non.", { status: 404 });
  const t = Date.now();
  const r = await generateStory({
    childFirstName: "Kamil", childAge: Number(u.searchParams.get("age") ?? 4), mode: "theme",
    themeId: u.searchParams.get("theme") ?? "dinosaures", longueur: "courte", style: (u.searchParams.get("style") ?? "anim3d") as never,
    format: u.searchParams.get("format") ?? "album",
  });
  if (!r.ok) return NextResponse.json({ ok: false, message: r.message, s: (Date.now() - t) / 1000 });
  const mini = async (x: string | null | undefined) => {
    const d = await fetchAsDataUrl(x, { maxPx: 1024, quality: 80 });
    if (!d) return null;
    const b = await sharp(Buffer.from(d.split(",")[1]!, "base64")).resize({ width: 480 }).jpeg({ quality: 72 }).toBuffer();
    return "data:image/jpeg;base64," + b.toString("base64");
  };
  return NextResponse.json({
    ok: true, s: (Date.now() - t) / 1000, report: r.imageReport, titre: r.story.titre, personnages: r.story.personnages, cast: r.story.cast,
    couverture: await mini(r.story.couvertureUrl),
    pages: await Promise.all(r.story.pages.map(async (p) => ({ texte: p.texte, presents: p.presents, scene: p.scene_illustration, img: await mini(p.imageUrl) }))),
  });
}
