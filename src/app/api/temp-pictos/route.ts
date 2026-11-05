/** TEMPORAIRE — génération des petits dessins (pictos) du site. Protégé par empreinte de secret. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
export const runtime = "nodejs";
export const maxDuration = 300;

const STYLE =
  "A single small storybook spot illustration of SUBJECT. Soft painterly gouache children's picture-book style, gentle glowing light, harmonious colors with periwinkle blue, soft pink and warm cream accents, rounded friendly shapes, one centered subject, generous empty margin, no text, no letters, no numbers, no frame, no border, no shadow on the ground, isolated on a plain pure white background.";

async function fal(path: string, body: unknown): Promise<{ ok: boolean; j: any }> {
  const r = await fetch(`https://fal.run/${path}`, {
    method: "POST",
    headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(200_000),
  });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}

export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "1d9222622a5a56b6b1a7a0000b1ec613dd00c459cda47a05968b808445260ce3") return new NextResponse("Non.", { status: 404 });
  const { items } = (await req.json()) as { items: { key: string; subject: string }[] };
  const out = await Promise.all(
    items.slice(0, 10).map(async ({ key, subject }) => {
      try {
        const g = await fal("fal-ai/flux-2-pro", { prompt: STYLE.replace("SUBJECT", subject), image_size: "square", output_format: "png" });
        const src = g.j.images?.[0]?.url as string | undefined;
        if (!src) return { key, url: null, err: JSON.stringify(g.j).slice(0, 200) };
        const d = await fal("fal-ai/birefnet", { image_url: src, output_format: "png" });
        return { key, url: (d.j.image?.url as string | undefined) ?? null, brut: src, err: d.ok ? null : JSON.stringify(d.j).slice(0, 200) };
      } catch (e) {
        return { key, url: null, err: String(e).slice(0, 200) };
      }
    }),
  );
  return NextResponse.json(out);
}
