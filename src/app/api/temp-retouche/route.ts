/** TEMPORAIRE — test « planche + retouche de l'enfant et du doudou ». Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { noterDepense, PRIX_ESTIMES } from "@/lib/budget";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432")
    return new NextResponse("Non.", { status: 404 });
  const b = (await req.json()) as { planche: string; doudou: string; prompt: string };
  const r = await fetch("https://fal.run/fal-ai/flux-2-pro/edit", {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: b.prompt,
      image_urls: [`data:image/jpeg;base64,${b.planche}`, `data:image/jpeg;base64,${b.doudou}`],
      image_size: "square_hd",
      output_format: "jpeg",
      seed: 4242,
    }),
    signal: AbortSignal.timeout(150_000),
  });
  const j = (await r.json().catch(() => ({}))) as { images?: { url?: string }[] };
  if (r.ok) await noterDepense(PRIX_ESTIMES.image);
  const url = j.images?.[0]?.url;
  if (!url) return NextResponse.json({ err: r.status, detail: JSON.stringify(j).slice(0, 300) });
  const img = await fetch(url).then((x) => x.arrayBuffer());
  return NextResponse.json({ image: Buffer.from(img).toString("base64") });
}
