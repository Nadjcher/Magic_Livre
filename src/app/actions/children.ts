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

  // Protection : la suppression d'un enfant supprime en cascade ses livres et
  // les commandes associées. On refuse donc la suppression si l'enfant a au
  // moins un livre acheté, pour ne pas détruire un contenu payé ni son
  // enregistrement comptable. La suppression complète reste possible via la
  // suppression du compte (RGPD).
  const paidOrder = await prisma.order.findFirst({
    where: { userId: user.id, status: "paid", book: { childId } },
  });
  if (paidOrder) {
    return {
      ok: false,
      message:
        "Cet enfant a au moins un livre acheté. Pour conserver vos achats, " +
        "la suppression n'est pas possible ici. Vous pouvez supprimer les " +
        "livres non payés, ou supprimer l'ensemble de vos données depuis la " +
        "page « Mon compte ».",
    };
  }

  // Aucun achat : la suppression en cascade ne retire que des livres non payés.
  await prisma.child.delete({ where: { id: childId } });

  revalidatePath("/enfants");
  revalidatePath("/bibliotheque");
  return { ok: true, message: "Enfant supprimé." };
}
