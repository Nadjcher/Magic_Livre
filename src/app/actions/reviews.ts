"use server";

/** Dépôt d'un avis vérifié et modération (administrateurs). */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { checkUserText } from "@/lib/validation";
import { estAdmin } from "@/lib/rateLimit";
import { aAchete, changerVisibilite, enregistrerAvis } from "@/lib/reviews";
import { alerterAdmin } from "@/lib/notifications";

export async function deposerAvis(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Connectez-vous pour donner votre avis." };
  const bookId = String(formData.get("bookId") ?? "");
  const note = Number(formData.get("note"));
  const texte = String(formData.get("texte") ?? "").trim().replace(/\s+/g, " ");
  const prenom = String(formData.get("prenom") ?? "").trim();
  const age = String(formData.get("age") ?? "").trim();

  if (!(note >= 1 && note <= 5 && Number.isInteger(note))) return { ok: false, message: "Choisissez une note de 1 à 5 étoiles." };
  if (texte.length < 10) return { ok: false, message: "Écrivez au moins quelques mots (10 caractères)." };
  if (texte.length > 600) return { ok: false, message: "Votre avis est un peu long (600 caractères maximum)." };
  if (!/^[\p{L}][\p{L} '-]{0,29}$/u.test(prenom)) return { ok: false, message: "Indiquez votre prénom (30 caractères maximum)." };
  for (const t of [texte, prenom]) {
    const c = checkUserText(t);
    if (!c.ok) return { ok: false, message: c.message };
  }
  if (!(await aAchete(user.id, bookId))) return { ok: false, message: "Seuls les acheteurs de ce livre peuvent le noter." };

  const auteur = age ? `${prenom}, parent d'un enfant de ${age} ans` : prenom;
  await enregistrerAvis(user.id, bookId, note, texte, auteur);
  await alerterAdmin("nouvel avis client", `${"★".repeat(note)} — ${auteur} : « ${texte.slice(0, 200)} »`).catch(() => undefined);
  revalidatePath("/");
  revalidatePath("/avis");
  return { ok: true, message: "Merci beaucoup pour votre avis ! 💙" };
}

export async function modererAvis(id: string, visible: boolean): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) return { ok: false };
  await changerVisibilite(id, visible);
  revalidatePath("/");
  revalidatePath("/avis");
  revalidatePath("/admin/avis");
  return { ok: true };
}
