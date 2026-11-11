"use server";

/**
 * « Est-ce bien votre enfant ? » : dessine le portrait du héros d'après la
 * photo, dans le style du livre, pour que le parent le valide AVANT qu'on
 * dessine les pages. Une seule nouvelle tentative possible.
 */

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/rateLimit";
import { checkUserText } from "@/lib/validation";
import { budgetDepasse } from "@/lib/budget";
import { lirePhoto } from "@/lib/photo";
import { dessinerPortrait, enregistrerHeros, lireHeros, portraitsDuJour, traitsDepuisPhoto } from "@/lib/heros";
import { ILLUSTRATION_STYLE_KEYS, type IllustrationStyle } from "@/lib/style_config";

export type PortraitResultat =
  | { ok: true; herosId: string; image: string; traits: string; lumiere: "ok" | "chaude"; essais: number }
  | { ok: false; message: string };

export async function preparerHeros(formData: FormData): Promise<PortraitResultat> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };
  const photo = await lirePhoto(formData.get("photo"));
  if (!photo) return { ok: false, message: "La photo n'a pas pu être lue. Essayez avec une autre photo." };
  const styleBrut = String(formData.get("style") ?? "feerique");
  const style = ((ILLUSTRATION_STYLE_KEYS as readonly string[]).includes(styleBrut) ? styleBrut : "feerique") as IllustrationStyle;
  const precedent = String(formData.get("herosId") ?? "");
  const childId = String(formData.get("childId") ?? "");
  const enfant = childId && childId !== "nouveau" ? await prisma.child.findFirst({ where: { id: childId, userId: user.id }, select: { id: true } }) : null;

  // Garde-fous : budget du jour, 4 portraits par jour et par compte, 1 nouvelle tentative.
  const admin = estAdmin(user.email);
  if (!admin && (await budgetDepasse())) {
    return { ok: false, message: "Trop de demandes aujourd'hui : réessayez demain, ou continuez sans photo (avec une description)." };
  }
  if (!admin && (await portraitsDuJour(user.id)) >= 4) {
    return { ok: false, message: "Vous avez demandé 4 portraits aujourd'hui : gardez le dernier, ou continuez avec une description." };
  }
  let essais = 1;
  if (precedent) {
    const h = await lireHeros(precedent, user.id);
    // Deux portraits, puis un dernier seulement avec des traits corrigés par le parent.
    if (h && h.essais >= 3 && !admin) {
      return { ok: false, message: "C'était le dernier portrait possible. Gardez-le, ou continuez avec un héros décrit, sans photo." };
    }
    if (h && h.essais >= 2 && !admin && String(formData.get("traits") ?? "").trim() === h.traits.trim()) {
      return { ok: false, message: "Pour un dernier portrait, corrigez d'abord ses traits dans la liste (cheveux, yeux, signes particuliers…)." };
    }
    essais = (h?.essais ?? 1) + 1;
  }

  // Les traits : ceux corrigés par le parent, sinon lus sur la photo.
  let traits = String(formData.get("traits") ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
  let lumiere: "ok" | "chaude" = "ok";
  if (traits) {
    const check = checkUserText(traits);
    if (!check.ok) return { ok: false, message: check.message };
  } else {
    const t = await traitsDepuisPhoto(photo);
    traits = t.traits;
    lumiere = t.lumiere;
  }

  const r = await dessinerPortrait(photo, traits, style);
  if ("erreur" in r) {
    return {
      ok: false,
      message:
        r.erreur === "filtre"
          ? "Le service de dessin a refusé cette photo (filtre de sécurité automatique). Essayez une autre photo, de face, en lumière du jour, ou continuez avec une description."
          : "Le portrait n'a pas pu être dessiné pour l'instant. Réessayez dans un moment, ou continuez avec une description.",
    };
  }
  const herosId = await enregistrerHeros({ userId: user.id, childId: enfant?.id ?? null, style, portrait: r.imageUrl, traits, essais });
  return { ok: true, herosId, image: `data:${r.ref.mime};base64,${r.ref.base64}`, traits, lumiere, essais };
}
