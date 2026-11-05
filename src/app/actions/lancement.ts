"use server";

/** Liste d'attente (visiteurs) et email d'ouverture des ventes (administrateur). */

import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { checkLoginRate } from "@/lib/rateLimitAuth";
import { waitUntil } from "@vercel/functions";
import { inscrireAttente } from "@/lib/lancement";
import { bienvenueListe, CAMPAGNES, envoyerCampagne, type Campagne } from "@/lib/campagnes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function rejoindreListe(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, message: "Adresse email invalide." };
  const ip = (headers().get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "inconnue";
  const { allowed } = await checkLoginRate(`attente:${email}`, `attente:${ip}`);
  if (!allowed) return { ok: false, message: "Trop d'essais. Réessayez dans quelques minutes." };
  const nouveau = await inscrireAttente(email, String(formData.get("source") ?? "site").slice(0, 40));
  if (nouveau) waitUntil(bienvenueListe(email).catch(() => undefined));
  return { ok: true, message: "C'est noté ! Vous serez prévenu(e) dès l'ouverture. En attendant, vous pouvez déjà créer et lire un livre gratuitement." };
}

/** Envoie une campagne à un lot de destinataires (administrateur). */
export async function envoyerCampagneAdmin(campagne: Campagne): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) return { ok: false, message: "Réservé à l'administrateur." };
  if (!CAMPAGNES.some((c) => c.id === campagne)) return { ok: false, message: "Campagne inconnue." };
  const { envoyes, reste } = await envoyerCampagne(campagne);
  return { ok: true, message: `${envoyes} email(s) envoyé(s).${reste > 0 ? ` Il en reste ${reste} : cliquez à nouveau.` : " Tout le monde l'a reçu."}` };
}
