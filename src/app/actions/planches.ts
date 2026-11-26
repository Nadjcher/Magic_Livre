"use server";

/** Atelier des planches (administrateurs) : dessiner, valider, faire redessiner. */

import { waitUntil } from "@vercel/functions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { dessinerPlanches, effacerPlanche, histoireParId, validerPlanche, clesPlanches, utiliserCandidate, revenirAncienne, verifierPlanches } from "@/lib/planches";
import { STYLE_DEFAUT, type IllustrationStyle } from "@/lib/style_config";

async function admin(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && estAdmin(user.email));
}

/** Dessine les planches manquantes (payant : environ 0,05 $ par planche). À relancer s'il en manque encore. */
export async function dessinerPlanchesAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const h = histoireParId(String(formData.get("histoire") ?? ""));
  if (!h) return;
  const style = (String(formData.get("style") ?? "") || STYLE_DEFAUT) as IllustrationStyle;
  waitUntil(
    dessinerPlanches(h, style, Date.now() + 250_000)
      .then((r) => console.log("[planches]", h.id, r.dessinees, "dessinées", r.erreurs.join(" | ").slice(0, 300)))
      .catch((e) => console.error("[planches]", String(e).slice(0, 200))),
  );
  revalidatePath("/admin/planches");
}

export async function validerPlancheAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const histoire = String(formData.get("histoire") ?? "");
  const style = String(formData.get("style") ?? "") || STYLE_DEFAUT;
  const cle = String(formData.get("cle") ?? "");
  const h = histoireParId(histoire);
  if (!h) return;
  if (cle === "*") {
    for (const k of clesPlanches(h)) await validerPlanche(histoire, style, k.cle, true);
  } else await validerPlanche(histoire, style, cle, formData.get("valide") !== "non");
  revalidatePath("/admin/planches");
}

/** Retire la planche : elle sera redessinée au prochain « Dessiner les planches manquantes ». */
export async function redessinerPlancheAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const histoire = String(formData.get("histoire") ?? "");
  const style = String(formData.get("style") ?? "") || STYLE_DEFAUT;
  const cle = String(formData.get("cle") ?? "");
  if (!histoireParId(histoire) || !cle) return;
  const h = histoireParId(histoire)!;
  await effacerPlanche(histoire, style, cle);
  // Un seul geste : la planche effacée est redessinée tout de suite, en arrière-plan (seules les
  // planches manquantes sont dessinées). Le message en haut de la page confirme que c'est parti.
  waitUntil(
    dessinerPlanches(h, style as IllustrationStyle, Date.now() + 250_000)
      .then((r) => console.log("[planches] redessin", h.id, cle, r.dessinees, "dessinées", r.erreurs.join(" | ").slice(0, 300)))
      .catch((e) => console.error("[planches] redessin", String(e).slice(0, 200))),
  );
  revalidatePath("/admin/planches");
  redirect(`/admin/planches?redessin=${encodeURIComponent(cle)}`);
}

/** Met la planche candidate en service (échange atomique, déjà validée, ancienne gardée de côté). */
export async function utiliserCandidateAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const histoire = String(formData.get("histoire") ?? "");
  const style = String(formData.get("style") ?? "") || STYLE_DEFAUT;
  const cle = String(formData.get("cle") ?? "");
  if (!histoireParId(histoire) || !cle) return;
  await utiliserCandidate(histoire, style, cle, formData.get("sens") === "dos");
  revalidatePath("/admin/planches");
}

/** Remet la planche gardée de côté, en un clic. */
export async function revenirAncienneAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const histoire = String(formData.get("histoire") ?? "");
  const style = String(formData.get("style") ?? "") || STYLE_DEFAUT;
  const cle = String(formData.get("cle") ?? "");
  if (!histoireParId(histoire) || !cle) return;
  await revenirAncienne(histoire, style, cle);
  revalidatePath("/admin/planches");
}

/** L'agent regarde les planches dessinées pas encore vérifiées (payant : environ 0,03 $ par planche). */
export async function verifierPlanchesAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const h = histoireParId(String(formData.get("histoire") ?? ""));
  if (!h) return;
  const style = (String(formData.get("style") ?? "") || STYLE_DEFAUT) as IllustrationStyle;
  waitUntil(
    verifierPlanches(h, style, Date.now() + 250_000, formData.get("toutes") === "oui")
      .then((n) => console.log("[planches] agent :", h.id, n, "vérifiées"))
      .catch((e) => console.error("[planches] agent", String(e).slice(0, 200))),
  );
  revalidatePath("/admin/planches");
}
