import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { resolveImages } from "@/lib/imageFetch";
import { renderStoryPdf } from "@/lib/pdf";

/** Image PNG « bruitée » (incompressible) de 1536×1024, comme une vraie page. */
async function grossePage(seed: number): Promise<string> {
  const w = 1536, h = 1024;
  const raw = Buffer.alloc(w * h * 3);
  let x = seed * 2654435761;
  for (let i = 0; i < raw.length; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    raw[i] = (i % 3 === 0 ? (i / 3) % w : x >>> 24) & 0xff;
  }
  const png = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

describe("taille du PDF du livre", () => {
  it("reste sous la limite de 4,5 Mo de Vercel avec 12 pages illustrées", async () => {
    const urls = await Promise.all(Array.from({ length: 13 }, (_, i) => grossePage(i + 1)));
    const brut = urls.reduce((n, u) => n + u.length * 0.75, 0);
    expect(brut).toBeGreaterThan(20_000_000); // ~ le cas réel qui plantait
    const [cover, ...imgs] = await resolveImages(urls, { maxPx: 1200, quality: 74 });
    const pdf = await renderStoryPdf({
      titre: "Léo et la forêt",
      style: "feerique",
      couvertureUrl: cover,
      pages: imgs.map((u, i) => ({ texte: `Page ${i + 1}`, scene_illustration: "scène", imageUrl: u })),
    } as never);
    expect(pdf.length).toBeLessThan(4_200_000);
  }, 60_000);
});
