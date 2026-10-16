import { describe, it, expect } from "vitest";
import {
  findProtectedNames,
  containsProtectedName,
  normalizeForMatch,
} from "@/lib/protectedCharacters";

describe("liste des personnages protégés", () => {
  it("détecte un nom protégé simple", () => {
    expect(containsProtectedName("Je veux une histoire avec Mickey")).toBe(true);
  });

  it("détecte un nom protégé composé", () => {
    expect(containsProtectedName("une aventure avec Harry Potter")).toBe(true);
  });

  it("est insensible à la casse et aux accents", () => {
    expect(containsProtectedName("POKÉMON")).toBe(true);
    expect(containsProtectedName("pokemon")).toBe(true);
  });

  it("n'a pas de faux positif sur un mot qui contient le nom", () => {
    // « marioland » ne doit pas déclencher « mario » (limite de mot).
    expect(containsProtectedName("marioland")).toBe(false);
  });

  it("accepte un prénom original", () => {
    expect(containsProtectedName("Sami")).toBe(false);
    expect(findProtectedNames("Lila la renarde")).toHaveLength(0);
  });

  it("renvoie la liste des noms trouvés", () => {
    const found = findProtectedNames("Spider-Man et Batman sauvent la ville");
    expect(found).toContain("spider-man");
    expect(found).toContain("batman");
  });

  it("normalise correctement les accents et espaces", () => {
    expect(normalizeForMatch("  Pokémon   GO ")).toBe("pokemon go");
  });
});
