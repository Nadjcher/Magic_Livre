"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/rateLimit";
import { basculerDemo } from "@/lib/demo";

/** Range (ou sort) un livre de la section « démonstration ». Réservé aux administrateurs. */
export async function rangerEnDemo(bookId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) return { ok: false };
  const livre = await prisma.book.findFirst({ where: { id: bookId, userId: user.id }, select: { id: true } });
  if (!livre) return { ok: false };
  await basculerDemo(user.id, bookId);
  revalidatePath("/bibliotheque");
  revalidatePath("/club");
  return { ok: true };
}
