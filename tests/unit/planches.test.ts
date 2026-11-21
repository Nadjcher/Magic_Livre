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

import { adapterNoms, remplir } from "@/lib/histoiresMaitresses";
describe("personnages du conte et prénom de l'enfant", () => {
  it("un enfant qui s'appelle Malo ne rencontre pas Malo", () => {
    const h = HISTOIRES_MAITRESSES.find((x) => x.id === "maitresse-rentree")!;
    const a = adapterNoms(h, "Malo");
    expect(JSON.stringify(a)).not.toContain("Malo");
    expect(a.cast[0]!.nom).toBe("Noé");
    expect(adapterNoms(h, "Léo")).toBe(h);
  });
  it("« l'oreille d'Oscar », « de son lapin »", () => {
    const h = HISTOIRES_MAITRESSES[0]!;
    const p = { prenom: "Léo", fille: false, doudou: "Oscar", sonDoudou: "son ours", doudouVisuel: "", parent: "Papa" as const, passages: {} };
    expect(remplir("l'oreille {de_doudou}", p, h)).toBe("l'oreille d'Oscar");
    expect(remplir("l'oreille {de_doudou}", { ...p, doudou: "" }, h)).toBe("l'oreille de son ours");
  });
});

describe("enfant vu de dos", () => {
  it("la page 8 du Petit Poucet est « de dos », mais pas la couverture (enfant de face)", () => {
    const h = HISTOIRES_MAITRESSES.find((x) => x.id === "maitresse-petit-poucet")!;
    expect(clePour(h, -1, "homme")?.deDos).toBe(false);
    expect(clePour(h, 7, "homme")?.deDos).toBe(true);
    expect(clePour(h, 3, "homme")?.deDos).toBe(false);
  });
});

describe("enfant vu de dos", () => {
  it("le parent de dos ne met pas l'enfant de dos (page 1 du Poucet)", async () => {
    const { enfantDeDos } = await import("@/lib/planches");
    expect(enfantDeDos("{prenom} sits in bed hugging {doudou}; {parent} (seen from behind, face not shown) opens a book")).toBe(false);
    expect(enfantDeDos("Seen from behind, {prenom} walks with empty hands")).toBe(true);
    expect(enfantDeDos("{prenom} stands facing the viewer (never a back view, never the head twisted)")).toBe(false);
    expect(enfantDeDos("{prenom} eats; Papa Ours only seen from behind at the stove")).toBe(false);
  });
});
