"use server";

/**
 * Server Action : suppression du compte et de toutes les données associées
 * (RGPD). La suppression de l'utilisateur entraîne, via les relations
 * onDelete: Cascade, la suppression de ses enfants, livres, commandes et
 * sessions.
 */

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";

export async function deleteAccount(): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  // Supprime l'utilisateur ; les données liées partent en cascade.
  await prisma.user.delete({ where: { id: user.id } });

  // Déconnecte la session courante.
  await signOut({ redirect: false });

  return {
    ok: true,
    message: "Votre compte et toutes vos données ont été supprimés.",
  };
}
