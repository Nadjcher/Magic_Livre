"use server";

/** Liste d'attente (visiteurs) et email d'ouverture des ventes (administrateur). */

import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { checkLoginRate } from "@/lib/rateLimitAuth";
import { destinatairesOuverture, inscrireAttente, marquerPrevenu } from "@/lib/lancement";
import { emailAvecBouton } from "@/lib/mailer";
import { getAppUrl } from "@/lib/appUrl";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function rejoindreListe(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, message: "Adresse email invalide." };
  const ip = (headers().get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "inconnue";
  const { allowed } = await checkLoginRate(`attente:${email}`, `attente:${ip}`);
  if (!allowed) return { ok: false, message: "Trop d'essais. Réessayez dans quelques minutes." };
  await inscrireAttente(email, String(formData.get("source") ?? "site").slice(0, 40));
  return { ok: true, message: "C'est noté ! Vous serez prévenu(e) dès l'ouverture. En attendant, vous pouvez déjà créer et lire un livre gratuitement." };
}

/** Envoie l'email d'ouverture à la liste d'attente et aux comptes (une seule fois chacun, par lots). */
export async function envoyerOuverture(): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) return { ok: false, message: "Réservé à l'administrateur." };
  const liste = (await destinatairesOuverture()).slice(0, 150);
  let n = 0;
  for (const email of liste) {
    const ok = await emailAvecBouton(
      email,
      "C'est ouvert : offrez-lui le livre dont il est le héros ✨",
      "Encore une histoire est ouvert !",
      "Le livre personnalisé de votre enfant est prêt à être créé : son prénom, son visage, une histoire écrite pour son âge. Lecture gratuite, PDF dès 6,99 € et livre imprimé livré avant Noël.",
      `${getAppUrl()}/creer`,
      "Créer son histoire",
    );
    if (ok) {
      await marquerPrevenu(email);
      n++;
    }
  }
  const reste = (await destinatairesOuverture()).length;
  return { ok: true, message: `${n} email(s) envoyé(s).${reste > 0 ? ` Il en reste ${reste} : cliquez à nouveau.` : " Tout le monde est prévenu."}` };
}
