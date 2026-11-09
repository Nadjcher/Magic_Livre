/**
 * Mini-romans : le texte d'une page commence par « Chapitre 1 — Titre ».
 * On sépare ce titre du corps pour l'afficher comme un vrai titre de chapitre.
 */
export function separerChapitre(texte: string): { chapitre: string | null; corps: string } {
  const m = /^\s*«?\s*(Chapitre\s+\d+\s*[—–-]\s*[^»\n]{1,90}?)\s*»?\s*(?:\n|(?=[«A-ZÀ-ÖØ-Þ]))/u.exec(texte);
  if (!m) return { chapitre: null, corps: texte };
  return { chapitre: (m[1] as string).trim(), corps: texte.slice(m[0].length).trim() };
}
