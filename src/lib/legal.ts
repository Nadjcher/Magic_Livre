/**
 * Identité légale du vendeur, lue dans les variables d'environnement (Vercel) :
 * rien à modifier dans le code pour la compléter.
 *
 *   LEGAL_NOM        ex. « Jean Dupont » ou « Storilou SAS »
 *   LEGAL_STATUT     ex. « Entrepreneur individuel (micro-entreprise) »
 *   LEGAL_SIREN      ex. « 123 456 789 »
 *   LEGAL_ADRESSE    adresse postale complète
 *   LEGAL_EMAIL      email de contact
 *   LEGAL_TVA        mention TVA (défaut : franchise en base)
 *   LEGAL_MEDIATEUR  nom et site du médiateur de la consommation
 */

const A_COMPLETER = "[à compléter]";
const v = (k: string) => (process.env[k] ?? "").trim();

export function identiteLegale() {
  return {
    nom: v("LEGAL_NOM") || A_COMPLETER,
    statut: v("LEGAL_STATUT") || "Entrepreneur individuel (micro-entreprise)",
    siren: v("LEGAL_SIREN") || A_COMPLETER,
    adresse: v("LEGAL_ADRESSE") || A_COMPLETER,
    email: v("LEGAL_EMAIL") || process.env.EMAIL_FROM?.replace(/^.*<|>.*$/g, "") || A_COMPLETER,
    tva: v("LEGAL_TVA") || "TVA non applicable, article 293 B du Code général des impôts.",
    mediateur: v("LEGAL_MEDIATEUR") || A_COMPLETER,
  };
}

/** Vrai quand toutes les informations obligatoires sont renseignées. */
export function identiteComplete(): boolean {
  return ["LEGAL_NOM", "LEGAL_SIREN", "LEGAL_ADRESSE", "LEGAL_MEDIATEUR"].every((k) => v(k));
}

/** Version des CGV (à changer quand le texte change). */
export const VERSION_CGV = "2026-11";
