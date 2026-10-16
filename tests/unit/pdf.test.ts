import { describe, it, expect } from "vitest";
import { Children, isValidElement, type ReactElement } from "react";
import { Page } from "@react-pdf/renderer";
import { buildStoryDocument } from "@/lib/pdf";
import type { Story } from "@/lib/storySchema";

function histoire(pages: number): Story {
  return {
    titre: "Le voyage de Sami",
    pages: Array.from({ length: pages }, (_, i) => ({
      texte: `Page ${i + 1}`,
      scene_illustration: "Scène douce.",
    })),
  };
}

/** Compte récursivement les éléments de type Page dans l'arbre. */
function countPages(node: unknown): number {
  let total = 0;
  Children.forEach(node as never, (child) => {
    if (isValidElement(child)) {
      const el = child as ReactElement;
      if (el.type === Page) total += 1;
      if (el.props && "children" in el.props) {
        total += countPages((el.props as { children: unknown }).children);
      }
    } else if (Array.isArray(child)) {
      total += countPages(child);
    }
  });
  return total;
}

describe("construction du PDF", () => {
  it("construit un document sans erreur", () => {
    const doc = buildStoryDocument(histoire(8));
    expect(isValidElement(doc)).toBe(true);
  });

  it("produit une page de couverture + une page par page d'histoire", () => {
    const story = histoire(10);
    const doc = buildStoryDocument(story);
    // 1 couverture + 10 pages = 11 pages PDF.
    expect(countPages(doc.props.children)).toBe(story.pages.length + 1);
  });

  it("reflète le titre de l'histoire", () => {
    const doc = buildStoryDocument(histoire(8));
    expect(doc.props.title).toBe("Le voyage de Sami");
  });
});
