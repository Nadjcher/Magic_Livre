/** TEMPORAIRE — livres de démonstration dans le compte administrateur. Protégé par empreinte de secret. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { generateStory } from "@/lib/storyGenerator";
import { getAppUrl } from "@/lib/appUrl";
export const runtime = "nodejs";
export const maxDuration = 300;
const DEMOS: Record<string, { prenom: string; age: number; req: Record<string, unknown>; photo?: boolean; appearance?: string; titreTheme: string }> = {
  leo: { prenom: "Léo", age: 5, photo: true, titreTheme: "Le Noël magique", req: { mode: "theme", themeId: "noel", format: "album", style: "anim3d", longueur: "courte" } },
  mia: { prenom: "Mia", age: 2, titreTheme: "Imagier", appearance: "2-year-old toddler girl, short curly light-brown hair, round cheeks, yellow overalls", req: { mode: "libre", prompt: "La journée de Mia, du réveil au dodo, avec son nounours", format: "imagier", style: "pastel", longueur: "courte" } },
  hugo: { prenom: "Hugo", age: 9, titreTheme: "Manga", appearance: "9-year-old boy, short spiky black hair, brown eyes, orange hoodie, blue jeans, red sneakers", req: { mode: "libre", prompt: "Hugo rêve de gagner le grand tournoi de skate de la ville", format: "manga", style: "manga", longueur: "courte" } },
  lina: { prenom: "Lina", age: 6, titreTheme: "Le Petit Chaperon rouge", appearance: "6-year-old girl, long dark braided hair, brown skin, big brown eyes", req: { mode: "theme", themeId: "chaperon-rouge", format: "album", style: "classique", longueur: "courte" } },
};
export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  if (createHash("sha256").update(u.searchParams.get("s") ?? "").digest("hex") !== "60f9804f692b5d47e044b4a8dc4d13f189abfb311f95c2e15e2feab7d81d2fd3") return new NextResponse("Non.", { status: 404 });
  const d = DEMOS[u.searchParams.get("d") ?? ""];
  if (!d) return NextResponse.json({ erreur: "démo inconnue" });
  const emails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const admin = await prisma.user.findFirst({ where: { email: { in: emails } }, orderBy: { createdAt: "asc" } });
  if (!admin) return NextResponse.json({ erreur: "compte administrateur introuvable" });
  let photo: { base64: string; mime: string } | undefined;
  if (d.photo) {
    const r = await fetch(getAppUrl() + "/exemple/photo.webp");
    const b = await sharp(Buffer.from(await r.arrayBuffer())).jpeg({ quality: 88 }).toBuffer();
    photo = { base64: b.toString("base64"), mime: "image/jpeg" };
  }
  const child = (await prisma.child.findFirst({ where: { userId: admin.id, firstName: d.prenom } })) ??
    (await prisma.child.create({ data: { userId: admin.id, firstName: d.prenom, age: d.age } }));
  const t = Date.now();
  const r = await generateStory({ childFirstName: d.prenom, childAge: d.age, photo, appearance: d.appearance, ...(d.req as object) } as never);
  if (!r.ok) return NextResponse.json({ ok: false, message: r.message, s: (Date.now() - t) / 1000 });
  const book = await prisma.book.create({
    data: { userId: admin.id, childId: child.id, title: r.story.titre, theme: d.titreTheme, status: "ready", tier: "standard", pages: r.story as never, errorMessage: r.imageReport ?? null },
  });
  await prisma.order.create({ data: { userId: admin.id, bookId: book.id, sku: "book", status: "paid", amount: 0, currency: "eur" } });
  return NextResponse.json({ ok: true, titre: r.story.titre, report: r.imageReport, s: (Date.now() - t) / 1000 });
}
