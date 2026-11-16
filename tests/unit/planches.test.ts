import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { clesPlanches, clePour } from "@/lib/planches";
import { HISTOIRES_MAITRESSES } from "@/lib/histoiresMaitresses";
import { lireDoudou, texteDoudou, visuelDoudou } from "@/lib/doudous";

describe("planches", () => {
  for (const h of HISTOIRES_MAITRESSES) {
    it(`« ${h.id} » : une planche par page (deux quand le parent apparaît), couverture comprise`, () => {
      const cles = clesPlanches(h);
      const avecParent = [h.couverture, ...h.pages.map((p) => p.scene)].filter((t) => t.includes("{parent}")).length;
      expect(cles.length).toBe(h.pages.length + 1 + avecParent);
      for (let i = -1; i < h.pages.length; i++) {
        expect(clePour(h, i, "homme")).toBeDefined();
        expect(clePour(h, i, "femme")).toBeDefined();
      }
    });
  }
  it("Petit Poucet : la page 1 (le parent ouvre le livre) a deux variantes", () => {
    const h = HISTOIRES_MAITRESSES.find((x) => x.id === "maitresse-petit-poucet")!;
    expect(clePour(h, 0, "femme")?.cle).toBe("p1:femme");
  });
});

describe("doudou choisi dans la liste", () => {
  it("lit le code et le décrit", () => {
    const d = lireDoudou("doudou:lapin:gris")!;
    expect(d.espece.son).toBe("son lapin");
    expect(visuelDoudou(d)).toContain("grey rabbit");
    expect(texteDoudou("doudou:girafe:jaune")).toBe("une girafe en peluche, jaune");
    expect(lireDoudou("un lapin tout doux")).toBeNull();
  });
});
