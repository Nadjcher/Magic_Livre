/** TEMPORAIRE — livre de test complet par la vraie chaîne (Petit Poucet, compte admin). Protégé. À supprimer. */
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
import { renderPrintPdf } from "@/lib/printBook";
import { imagesDuLivre } from "@/lib/print";
import type { StoryRequest } from "@/lib/storyPrompt";

export const runtime = "nodejs";
export const maxDuration = 300;

const ok = (u: URL) =>
  createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") === "5cbc44087d82ea1f62c9c11a087f0547c52ab63c029b66bf4e772b9403748432";

async function adminUser() {
  const email = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim().toLowerCase();
  return email ? prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } }) : null;
}

export async function POST(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (!ok(u)) return new NextResponse("Non.", { status: 404 });
  const user = await adminUser();
  if (!user) return NextResponse.json({ err: "admin introuvable" });
  const child = await prisma.child.create({ data: { userId: user.id, firstName: "Léo", age: 5 } });
  const book = await prisma.book.create({
    data: { userId: user.id, childId: child.id, title: "Histoire en cours…", theme: findThemeById("petit-poucet")?.titre ?? "Le Petit Poucet", status: "generating", tier: "standard" },
  });
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
  waitUntil(
    (async () => {
      const h = maitressePour("petit-poucet", 5)!;
      const story = await histoireDepuisMaitresse(h, r);
      await livrer({ bookId: book.id, req: r, portrait: null, tentative: 1 }, story);
    })().catch(async (e) => {
      await prisma.book.update({ where: { id: book.id }, data: { status: "failed", errorMessage: String(e).slice(0, 300) } });
    }),
  );
  return NextResponse.json({ bookId: book.id, debut: Date.now() });
}

export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (!ok(u)) return new NextResponse("Non.", { status: 404 });
  const id = u.searchParams.get("id") ?? "";
  const book = await prisma.book.findUnique({ where: { id }, select: { status: true, errorMessage: true, pages: true, title: true } });
  if (!book) return NextResponse.json({ err: "introuvable" });
  const st = storySchema.safeParse(book.pages);
  const action = u.searchParams.get("a");
  if (st.success && (action === "pdf" || action === "print")) {
    const pdf =
      action === "pdf"
        ? await renderStoryPdf(st.data, "Léo")
        : await renderPrintPdf(st.data, "Léo", await imagesDuLivre(st.data, "Léo", false));
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf" } });
  }
  return NextResponse.json({
    status: book.status,
    err: book.errorMessage,
    titre: book.title,
    controle: st.success ? st.data.controleImages : null,
    fiches: st.success ? st.data.fiches : null,
    couverture: st.success ? st.data.couvertureUrl : null,
    pages: st.success ? st.data.pages.map((p) => p.imageUrl) : null,
  });
}
