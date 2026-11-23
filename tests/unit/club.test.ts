import { describe, expect, it } from "vitest";
import { livreInclusClub } from "@/lib/histoiresMaitresses";

const membre = { actif: true, restants: 3 };
describe("Le Club comprend seulement les histoires toutes prêtes", () => {
  it("le Petit Poucet (histoire toute prête) est compris", () => {
    expect(livreInclusClub(membre, "theme", "petit-poucet", 6)).toBe(true);
  });
  it("un livre sur mesure n'est jamais compris : idée libre, thème écrit par l'IA, grand classique", () => {
    expect(livreInclusClub(membre, "libre", undefined, 6)).toBe(false);
    expect(livreInclusClub(membre, "theme", "haricot-magique", 6)).toBe(false);
  });
  it("hors de la tranche d'âge de l'histoire, ou sans livre restant, ou sans abonnement : pas compris", () => {
    expect(livreInclusClub(membre, "theme", "petit-poucet", 11)).toBe(false);
    expect(livreInclusClub({ actif: true, restants: 0 }, "theme", "petit-poucet", 6)).toBe(false);
    expect(livreInclusClub({ actif: false, restants: 0 }, "theme", "petit-poucet", 6)).toBe(false);
  });
});

describe("Stratégie de vente du 23 novembre", () => {
  it("histoire toute prête au prix de base, livre sur mesure à 9,90 €", async () => {
    const { prixLivreCents, estHistoirePrete } = await import("@/lib/products");
    const prete = { meta: { trame: "maitresse-petit-poucet" } };
    const surMesure = { meta: { trame: "depart:trame-quete", mode: "libre" } };
    expect(estHistoirePrete(prete)).toBe(true);
    expect(estHistoirePrete(surMesure)).toBe(false);
    expect(estHistoirePrete(null)).toBe(false);
    expect(prixLivreCents(prete, 699)).toBe(699);
    expect(prixLivreCents(surMesure, 699)).toBe(990);
    expect(prixLivreCents({}, 699)).toBe(990);
  });
  it("le Club est fermé au lancement ; ni dessin animé ni formule Tout compris en vente ; aucun thème réservé au Club", async () => {
    const { CLUB_OUVERT, VENTE_EXTRAS, DELUXE_PRODUCTS, getDeluxeProduct } = await import("@/lib/products");
    const { THEMES, reserveClub } = await import("@/lib/themes");
    expect(CLUB_OUVERT).toBe(false);
    expect(VENTE_EXTRAS).toBe(false);
    expect(DELUXE_PRODUCTS.some((p) => p.sku === "video")).toBe(false);
    // Un dessin animé déjà acheté reste connu (téléchargeable).
    expect(getDeluxeProduct("video")?.sku).toBe("video");
    expect(THEMES.some((t) => reserveClub(t))).toBe(false);
  });
});
