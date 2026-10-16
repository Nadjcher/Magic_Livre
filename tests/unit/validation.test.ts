import { describe, it, expect } from "vitest";
import {
  childSchema,
  createBookSchema,
  checkUserText,
} from "@/lib/validation";

describe("validation des entrées", () => {
  it("valide un enfant correct", () => {
    const res = childSchema.safeParse({ firstName: "Léa", age: 5 });
    expect(res.success).toBe(true);
  });

  it("refuse un prénom vide", () => {
    const res = childSchema.safeParse({ firstName: "", age: 5 });
    expect(res.success).toBe(false);
  });

  it("refuse un âge hors bornes", () => {
    expect(childSchema.safeParse({ firstName: "Léa", age: 0 }).success).toBe(false);
    expect(childSchema.safeParse({ firstName: "Léa", age: 20 }).success).toBe(false);
  });

  it("refuse un prénom avec des chiffres", () => {
    expect(childSchema.safeParse({ firstName: "Léa123", age: 5 }).success).toBe(false);
  });

  it("exige un héros en mode hero", () => {
    const res = createBookSchema.safeParse({
      childId: "c1",
      mode: "hero",
      longueur: "moyenne",
    });
    expect(res.success).toBe(false);
  });

  it("exige un texte en mode libre", () => {
    const res = createBookSchema.safeParse({
      childId: "c1",
      mode: "libre",
      prompt: "",
      longueur: "courte",
    });
    expect(res.success).toBe(false);
  });

  it("limite le texte libre à 300 caractères", () => {
    const res = createBookSchema.safeParse({
      childId: "c1",
      mode: "libre",
      prompt: "a".repeat(301),
      longueur: "courte",
    });
    expect(res.success).toBe(false);
  });

  it("accepte une création valide en mode libre", () => {
    const res = createBookSchema.safeParse({
      childId: "c1",
      mode: "libre",
      prompt: "Sami part acheter le pain.",
      longueur: "longue",
    });
    expect(res.success).toBe(true);
  });
});

describe("checkUserText (personnages protégés + filtre)", () => {
  it("refuse un personnage protégé", () => {
    const res = checkUserText("une aventure avec Elsa de la Reine des Neiges");
    expect(res.ok).toBe(false);
    expect(res.protectedNames.length).toBeGreaterThan(0);
  });

  it("refuse un contenu violent", () => {
    const res = checkUserText("une histoire où l'on tue le monstre");
    expect(res.ok).toBe(false);
  });

  it("accepte une aventure douce et originale", () => {
    const res = checkUserText("Sami part acheter le pain et aide un chat perdu");
    expect(res.ok).toBe(true);
  });
});
