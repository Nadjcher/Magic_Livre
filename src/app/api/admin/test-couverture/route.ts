/**
 * TEMPORAIRE — test du garde-fou « doudou » sur la couverture d'un livre (administrateurs).
 * À RETIRER dès la fin du test.
 *
 * - sans paramètre : liste les derniers livres (pour trouver l'id) ;
 * - ?book=<id> : affiche la couverture actuelle et un bouton (ne dépense RIEN) ;
 * - ?book=<id>&go=1 : régénère UNIQUEMENT la couverture (1 retouche ≈ 0,045 $) + 1 vérif
 *   vision (~0,001 $), soit ~0,05 $, et montre avant/après + le verdict du garde-fou.
 *
 * Ne modifie jamais le livre en base (lecture seule) : seule une image est produite chez fal.
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { retoucherPage } from "@/lib/planches";
import { especeAttendue, estPeluche, memeEspece } from "@/lib/controleIllustrations";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { env } from "@/lib/env";
import { falFetch } from "@/lib/jetonsFal";

export const runtime = "nodejs";
export const maxDuration = 300;

/** L'animal auquel ressemble la peluche sur une image (une seule question, ~0,001 $). */
async function animalVu(url: string): Promise<string> {
  const d = await fetchAsDataUrl(url, { maxPx: 768, quality: 80 });
  if (!d) return "";
  try {
    const r = await falFetch(
      "https://fal.run/openrouter/router/vision",
      {
        method: "POST",
        headers: { Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.QA_RETOUCHE_MODEL || "anthropic/claude-sonnet-4.5",
          prompt:
            'Look ONLY at the plush toy held by or next to the big child in this image. Answer JSON only: ' +
            '{"animal":"the animal it actually looks like (bear, giraffe, rabbit, dog, cat...), judged by ears, muzzle and shape"}.',
          image_urls: [d],
          max_tokens: 100,
          temperature: 0,
        }),
      },
      40_000,
    );
    const j = (await r.json().catch(() => ({}))) as { output?: string };
    const m = /\{[\s\S]*\}/.exec(j.output ?? "")?.[0];
    return m ? (JSON.parse(m).animal ?? "") : "";
  } catch {
    return "";
  }
}

function page(titre: string, corps: string): Response {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>${titre}</title>` +
      `<body style="font-family:system-ui,sans-serif;max-width:920px;margin:2rem auto;padding:0 1rem;line-height:1.5">${corps}</body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) return new NextResponse("Non.", { status: 404 });

  const u = new URL(req.url);
  const bookId = u.searchParams.get("book");

  if (!bookId) {
    const livres = await prisma.book.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, title: true, status: true },
    });
    const lignes = livres
      .map((l) => `<li><a href="?book=${l.id}">${l.title ?? "(sans titre)"}</a> — <code>${l.status}</code></li>`)
      .join("");
    return page("Test garde-fou — choisir un livre", `<h2>Choisissez un livre</h2><ol>${lignes}</ol>`);
  }

  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { pages: true, title: true } });
  const st = storySchema.safeParse(book?.pages);
  if (!st.success) return page("Introuvable", `<p>Livre introuvable ou illisible.</p>`);
  const story = st.data;
  const doudou = (story.cast ?? []).find((c) => estPeluche(c.visuel));
  const attendue = doudou ? especeAttendue(doudou.visuel) : null;
  const avant = story.couvertureUrl ?? null;

  if (u.searchParams.get("go") !== "1") {
    return page(
      "Test garde-fou — confirmer",
      `<h2>${book?.title ?? ""}</h2>` +
        `<p>Doudou attendu : <b>${attendue ?? "?"}</b></p>` +
        `<p>Couverture actuelle :</p>${avant ? `<img src="${avant}" width="420" style="border-radius:12px">` : "<p>—</p>"}` +
        `<p style="margin-top:1.5rem"><a href="?book=${bookId}&go=1" style="background:#143;color:#fff;padding:.7rem 1.1rem;border-radius:10px;text-decoration:none">Régénérer la couverture (~0,05 $)</a></p>` +
        `<p style="color:#777;font-size:.9em">Un seul clic = une seule dépense. Rien n'est enregistré sur le livre.</p>`,
    );
  }

  const nouvelle = await retoucherPage(story, -1); // 1 retouche ≈ 0,045 $
  const vu = nouvelle ? await animalVu(nouvelle) : ""; // 1 vérif vision ≈ 0,001 $
  const bloque = Boolean(attendue && vu && !memeEspece(attendue, vu));

  return page(
    "Test garde-fou — résultat",
    `<h2>${book?.title ?? ""}</h2>` +
      `<p>Doudou attendu : <b>${attendue ?? "?"}</b> — vu sur le nouvel essai : <b>${vu || "?"}</b></p>` +
      `<p>Garde-fou : <b style="color:${bloque ? "#b00020" : "#0a7d00"}">${
        bloque ? "BLOQUÉ → la couverture partirait en relecture humaine" : "OK → laissé passer"
      }</b></p>` +
      `<div style="display:flex;gap:1.2rem;flex-wrap:wrap;margin-top:1rem">` +
      `<figure><figcaption>Avant</figcaption>${avant ? `<img src="${avant}" width="400" style="border-radius:12px">` : "—"}</figure>` +
      `<figure><figcaption>Après (nouvel essai)</figcaption>${
        nouvelle ? `<img src="${nouvelle}" width="400" style="border-radius:12px">` : "<p>échec de la génération</p>"
      }</figure></div>`,
  );
}
