/** TEMPORAIRE — nouvelles illustrations d'exemple de l'accueil (style peint). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { generateIllustration } from "@/lib/illustration";
import { getAppUrl } from "@/lib/appUrl";
import type { IllustrationStyle } from "@/lib/style_config";
export const runtime = "nodejs";
export const maxDuration = 300;
async function ref(url: string) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  return { base64: Buffer.from(await r.arrayBuffer()).toString("base64"), mime: r.headers.get("content-type") ?? "image/webp" };
}
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "4b27043a04f72b350db1b9bb5c1671516633bca52989cb7ccf6f1ac25faa1826") return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { scene: string; style: IllustrationStyle; anchorUrl?: string; seed?: number };
  const photo = await ref(`${getAppUrl()}/exemple/photo.webp`);
  const anchor = b.anchorUrl ? await ref(b.anchorUrl) : undefined;
  const r = await generateIllustration({
    style: b.style,
    scene: b.scene,
    heroName: "Léo",
    appearance: "5-year-old boy with curly light-brown hair, wearing a mustard-yellow t-shirt and blue shorts",
    referenceImage: photo,
    anchorImage: anchor,
    premium: true,
    seed: b.seed ?? 7,
    recurringCharacters: "a small friendly red fox with a blue scarf",
    stocker: false,
  });
  return NextResponse.json(r);
}
