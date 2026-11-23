import { describe, expect, it } from "vitest";
import { porteQualite } from "@/lib/porteQualite";
import type { Story } from "@/lib/storySchema";

const page = (img: string | null) => ({ texte: "Léo marche.", scene_illustration: "Léo walks.", imageUrl: img });
const livre = (o: Partial<Story> = {}): Story =>
  ({
    titre: "Le livre de Léo",
    couvertureUrl: "https://x/c.jpg",
    pages: [page("https://x/1.jpg"), page("https://x/2.jpg"), page("https://x/3.jpg"), page("https://x/4.jpg")],
    controleImages: { verifiees: 5, refaites: 0, nonVerifiees: 0 },
    ...o,
  }) as Story;
const regle = { pagesApercu: 3, imagesAttendues: true, controleAttendu: true };

describe("La porte de qualité : aucun livre ne sort sans l'avoir passée", () => {
  it("un livre complet et vérifié sort", () => {
    expect(porteQualite(livre(), regle)).toEqual({ ok: true, raisons: [], pages: [] });
  });
  it("une image manquante retient le livre (page ou couverture)", () => {
    const v = porteQualite(livre({ couvertureUrl: null, pages: [page("a"), page(null), page("c"), page("d")] }), regle);
    expect(v.ok).toBe(false);
    expect(v.pages).toEqual([-1, 1]);
  });
  it("une image restée fautive retient le livre, aperçu gratuit compris", () => {
    expect(porteQualite(livre({ imagesARevoir: [2] }), regle).ok).toBe(false);
    expect(porteQualite(livre({ apercu: true, imagesARevoir: [0] }), regle).ok).toBe(false);
    expect(porteQualite(livre({ controleImages: { verifiees: 5, refaites: 1, nonVerifiees: 0, douteuses: [3] } }), regle).pages).toEqual([3]);
  });
  it("un contrôle en panne ne vaut jamais « conforme »", () => {
    expect(porteQualite(livre({ controleImages: undefined }), regle).ok).toBe(false);
    expect(porteQualite(livre({ controleImages: { verifiees: 3, refaites: 0, nonVerifiees: 2 } }), regle).ok).toBe(false);
  });
  it("un aperçu gratuit n'attend que sa couverture et ses premières pages", () => {
    const apercu = livre({ apercu: true, pages: [page("a"), page("b"), page("c"), page(null)] });
    expect(porteQualite(apercu, regle).ok).toBe(true);
    expect(porteQualite(livre({ apercu: true, pages: [page("a"), page(null), page("c"), page(null)] }), regle).pages).toEqual([1]);
  });
  it("un livre validé dans l'atelier sort, sauf s'il lui manque une image", () => {
    expect(porteQualite(livre({ valideAtelier: true, imagesARevoir: [1], controleImages: undefined }), regle).ok).toBe(true);
    expect(porteQualite(livre({ valideAtelier: true, couvertureUrl: null }), regle).ok).toBe(false);
  });
  it("sans vérification activée, seule l'absence d'image retient ; sans dessin activé, rien", () => {
    expect(porteQualite(livre({ controleImages: undefined }), { ...regle, controleAttendu: false }).ok).toBe(true);
    expect(porteQualite(livre({ couvertureUrl: null }), { ...regle, imagesAttendues: false }).ok).toBe(true);
  });
});

describe("Avant l'imprimeur", () => {
  it("un aperçu, une image manquante ou une image signalée ne partent pas à l'impression", async () => {
    const { refusImpression } = await import("@/lib/print");
    expect(refusImpression(livre())).toBeNull();
    expect(refusImpression(livre({ apercu: true }))).toContain("aperçu");
    expect(refusImpression(livre({ pages: [page("a"), page(null), page("c"), page("d")] }))).toContain("image manquante");
    expect(refusImpression(livre({ imagesARevoir: [0] }))).toContain("fautive");
  });
});
