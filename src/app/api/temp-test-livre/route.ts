/** TEMPORAIRE — livre de contrôle par la vraie chaîne (planches). Protégé. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { maitressePour } from "@/lib/histoiresMaitresses";
import { histoireDepuisMaitresse } from "@/lib/maitresseGenerateur";
import { livrer } from "@/lib/livraison";
import { findThemeById } from "@/lib/themes";
import { renderStoryPdf } from "@/lib/pdf";
import { resolveImages, fetchAsDataUrl } from "@/lib/imageFetch";
import { depensesRecentes } from "@/lib/budget";
import type { StoryRequest } from "@/lib/storyPrompt";

export const runtime = "nodejs";
export const maxDuration = 300;

const ok = (u: URL) =>
  createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") === "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432";

export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (!ok(u)) return new NextResponse("Non.", { status: 404 });
  const email = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim().toLowerCase();
  const user = email ? await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } }) : null;
  if (!user) return NextResponse.json({ err: "admin introuvable" });
  const child = await prisma.child.create({ data: { userId: user.id, firstName: "Inès", age: 5 } });
  const book = await prisma.book.create({
    data: { userId: user.id, childId: child.id, title: "Histoire en cours…", theme: findThemeById("petit-poucet")?.titre ?? "Le Petit Poucet", status: "generating", tier: "standard" },
  });
  const r = {
    childFirstName: "Inès",
    childAge: 5,
    mode: "theme",
    themeId: "petit-poucet",
    longueur: "moyenne",
    style: "anim3d",
    appearance: "a 5-year-old girl with long straight dark brown hair down to the shoulders, brown eyes, light olive skin",
    apercu: false,
    genre: "fille",
    extras: [
      { name: "Zaza", role: "doudou", appearance: "doudou:girafe:jaune" },
      { name: "Maman", role: "maman" },
    ],
  } as StoryRequest;
  const avant = (await depensesRecentes())[0];
  waitUntil(
    (async () => {
      const story = await histoireDepuisMaitresse(maitressePour("petit-poucet", 5)!, r);
      await livrer({ bookId: book.id, req: r, portrait: null, tentative: 1 }, story);
    })().catch(async (e) => {
      await prisma.book.update({ where: { id: book.id }, data: { status: "failed", errorMessage: String(e).slice(0, 300) } });
    }),
  );
  return NextResponse.json({ bookId: book.id, avant });
}

export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (!ok(u)) return new NextResponse("Non.", { status: 404 });
  const id = u.searchParams.get("id") ?? "";
  const book = await prisma.book.findUnique({ where: { id }, select: { status: true, errorMessage: true, pages: true, title: true } });
  if (!book) return NextResponse.json({ err: "introuvable" });
  const st = storySchema.safeParse(book.pages);
  const a = u.searchParams.get("a");
  if (st.success && a === "pdf") {
    const [cover, ...imgs] = await resolveImages([st.data.couvertureUrl, ...st.data.pages.map((p) => p.imageUrl)]);
    const pdf = await renderStoryPdf({ ...st.data, couvertureUrl: cover, pages: st.data.pages.map((p, i) => ({ ...p, imageUrl: imgs[i] ?? null })) }, "Inès");
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf" } });
  }
  if (st.success && a === "images") {
    const out: Record<string, string | null> = {};
    out.couverture = await fetchAsDataUrl(st.data.couvertureUrl, { maxPx: 640, quality: 82 });
    out.heros = await fetchAsDataUrl(st.data.fiches?.heros, { maxPx: 640, quality: 82 });
    for (const [n, url] of Object.entries(st.data.fiches?.cast ?? {})) out[`fiche:${n}`] = await fetchAsDataUrl(url, { maxPx: 640, quality: 82 });
    for (let i = 0; i < st.data.pages.length; i++) out[`p${i + 1}`] = await fetchAsDataUrl(st.data.pages[i]!.imageUrl, { maxPx: 640, quality: 82 });
    return NextResponse.json(out);
  }
  return NextResponse.json({
    status: book.status,
    err: book.errorMessage,
    titre: book.title,
    planches: st.success ? st.data.planches : null,
    controle: st.success ? st.data.controleImages : null,
    images: st.success ? [st.data.couvertureUrl, ...st.data.pages.map((p) => p.imageUrl)].filter(Boolean).length : 0,
    depenses: (await depensesRecentes())[0],
  });
}
