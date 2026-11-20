"use server";

/** Atelier des personnages « maison » (administrateurs) : dessiner, valider, faire redessiner. */

import { waitUntil } from "@vercel/functions";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { effacerPlanche, validerPlanche } from "@/lib/planches";
import { HISTOIRE_MAISON, PERSONNAGES_MAISON, dessinerMaison } from "@/lib/personnagesMaison";
import { STYLE_DEFAUT } from "@/lib/style_config";

async function admin(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && estAdmin(user.email));
}

const connu = (id: string) => PERSONNAGES_MAISON.some((p) => p.id === id);

/** Dessine les fiches manquantes (payant : environ 0,05 $ chacune), en arrière-plan. */
export async function dessinerMaisonAction(): Promise<void> {
  if (!(await admin())) return;
  waitUntil(
    dessinerMaison(STYLE_DEFAUT, Date.now() + 250_000)
      .then((r) => console.log("[maison]", r.dessines, "dessinés", r.erreurs.join(" | ").slice(0, 300)))
      .catch((e) => console.error("[maison]", String(e).slice(0, 200))),
  );
  revalidatePath("/admin/personnages");
}

export async function validerMaisonAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const id = String(formData.get("id") ?? "");
  if (!connu(id)) return;
  await validerPlanche(HISTOIRE_MAISON, STYLE_DEFAUT, id, formData.get("valide") !== "non");
  revalidatePath("/admin/personnages");
}

/** Efface la fiche : elle sera redessinée au prochain « Dessiner les personnages manquants ». */
export async function redessinerMaisonAction(formData: FormData): Promise<void> {
  if (!(await admin())) return;
  const id = String(formData.get("id") ?? "");
  if (!connu(id)) return;
  await effacerPlanche(HISTOIRE_MAISON, STYLE_DEFAUT, id);
  revalidatePath("/admin/personnages");
}
