"use server";

/**
 * Server Action : enregistrement du consentement parental.
 * Aucune création de livre n'est possible sans ce consentement.
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { consentSchema } from "@/lib/validation";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function recordConsent(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Vous devez être connecté." };
  }

  const parsed = consentSchema.safeParse({
    consent: formData.get("consent") === "on" || formData.get("consent") === "true",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "Vous devez confirmer être le parent ou le représentant légal.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      parentalConsentAt: new Date(),
      termsVersion: env.termsVersion(),
    },
  });

  revalidatePath("/creer");
  revalidatePath("/compte");
  return { ok: true, message: "Consentement enregistré. Merci !" };
}
