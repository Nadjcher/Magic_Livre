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
