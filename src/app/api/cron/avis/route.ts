/**
 * Tâche quotidienne (Vercel Cron) : 3 jours après un achat, demande à
 * l'acheteur son avis (un seul email par commande, jamais s'il a déjà noté).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assurerTables } from "@/lib/reviews";
import { emailAvecBouton } from "@/lib/mailer";
import { getAppUrl } from "@/lib/appUrl";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const viaVercel = (req.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  if (secret ? auth !== `Bearer ${secret}` : !viaVercel) return new NextResponse("Non autorisé.", { status: 401 });

  await assurerTables();
  const commandes = await prisma.$queryRaw<{ id: string; bookId: string; email: string; titre: string }[]>`
    SELECT DISTINCT ON (o."bookId") o.id, o."bookId", u.email, b.title AS titre
    FROM "Order" o
    JOIN "User" u ON u.id = o."userId"
    JOIN "Book" b ON b.id = o."bookId"
    WHERE o.status = 'paid'::"OrderStatus"
      AND o."createdAt" < NOW() - INTERVAL '3 days'
      AND o."createdAt" > NOW() - INTERVAL '14 days'
      AND b."deletedAt" IS NULL
      AND NOT EXISTS (SELECT 1 FROM "ReviewRequest" r WHERE r."orderId" = o.id)
      AND NOT EXISTS (SELECT 1 FROM "Review" v WHERE v."bookId" = o."bookId" AND v."userId" = o."userId")
      AND NOT EXISTS (SELECT 1 FROM "ReviewRequest" r2 JOIN "Order" o2 ON o2.id = r2."orderId" WHERE o2."bookId" = o."bookId")
    ORDER BY o."bookId", o."createdAt"
    LIMIT 50`;

  let envoyes = 0;
  for (const c of commandes) {
    await prisma.$executeRaw`INSERT INTO "ReviewRequest" ("orderId") VALUES (${c.id}) ON CONFLICT DO NOTHING`;
    const ok = await emailAvecBouton(
      c.email,
      "Votre enfant a aimé son histoire ? ⭐",
      `« ${c.titre.replace(/[<>&"]/g, "")} » vous a plu ?`,
      "Votre avis compte énormément : il aide d'autres parents à se décider, et nous aide à rendre chaque histoire encore plus belle. Cela prend moins d'une minute.",
      `${getAppUrl()}/avis/${c.bookId}`,
      "Donner mon avis",
    );
    if (ok) envoyes++;
  }
  return NextResponse.json({ candidats: commandes.length, envoyes });
}
