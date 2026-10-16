"use server";

/**
 * Server Actions : gestion des enfants (ajout, modification, suppression).
 * Le prénom est vérifié (personnages protégés + filtre de contenu).
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { childSchema, checkUserText } from "@/lib/validation";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** Lit et valide les champs enfant depuis un FormData. */
function parseChild(formData: FormData) {
  return childSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    age: Number(formData.get("age")),
  });
}

export async function addChild(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  const parsed = parseChild(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  }

  // Refuse un prénom contenant un personnage protégé ou un contenu inadapté.
  const check = checkUserText(parsed.data.firstName);
  if (!check.ok) return { ok: false, message: check.message };

  await prisma.child.create({
    data: {
      userId: user.id,
      firstName: parsed.data.firstName,
      age: parsed.data.age,
    },
  });

  revalidatePath("/enfants");
  return { ok: true, message: "Enfant ajouté." };
}

export async function updateChild(
  childId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  const parsed = parseChild(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  }

  const check = checkUserText(parsed.data.firstName);
  if (!check.ok) return { ok: false, message: check.message };

  // Vérifie que l'enfant appartient bien à l'utilisateur.
  const existing = await prisma.child.findFirst({
    where: { id: childId, userId: user.id },
  });
  if (!existing) return { ok: false, message: "Enfant introuvable." };

  await prisma.child.update({
    where: { id: childId },
    data: { firstName: parsed.data.firstName, age: parsed.data.age },
  });

  revalidatePath("/enfants");
  return { ok: true, message: "Enfant modifié." };
}

export async function deleteChild(childId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  const existing = await prisma.child.findFirst({
    where: { id: childId, userId: user.id },
  });
  if (!existing) return { ok: false, message: "Enfant introuvable." };

  // La suppression en cascade retire aussi les livres liés à cet enfant.
  await prisma.child.delete({ where: { id: childId } });

  revalidatePath("/enfants");
  revalidatePath("/bibliotheque");
  return { ok: true, message: "Enfant supprimé." };
}
