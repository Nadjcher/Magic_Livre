"use server";

/** Le parent valide son livre imprimé : il part chez l'imprimeur. */

import { waitUntil } from "@vercel/functions";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { storySchema } from "@/lib/storySchema";
import { validerImpression } from "@/lib/validationImpression";

export async function imprimerMonLivre(bookId: string): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };
  const book = await prisma.book.findFirst({ where: { id: bookId, userId: user.id, deletedAt: null }, select: { pages: true } });
  const st = storySchema.safeParse(book?.pages);
  if (!st.success || !st.data.impressionsAValider?.length) return { ok: false, message: "Aucune impression en attente pour ce livre." };
  if (st.data.apercu) return { ok: false, message: "Les dernières pages sont encore en cours de dessin : réessayez dans quelques minutes." };
  // La fabrication du fichier haute définition prend 1 à 3 minutes : elle continue en arrière-plan.
  waitUntil(validerImpression(bookId, user.id).catch((e) => console.error("[impression] validation", String(e).slice(0, 200))));
  revalidatePath(`/bibliotheque/${bookId}`);
  return { ok: true, message: "C'est parti ! Votre livre part chez l'imprimeur. Vous recevrez un email de confirmation." };
}
