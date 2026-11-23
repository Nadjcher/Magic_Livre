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
      const el = child as ReactElement<{ children?: unknown }>;
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

  it("produit couverture, dédicace, une page par page d'histoire, « Fin » et 4e de couverture", () => {
    const story = histoire(10);
    const doc = buildStoryDocument(story, "Sami");
    // couverture + dédicace + 10 pages + Fin + 4e de couverture = 14 pages PDF.
    expect(countPages(doc.props.children)).toBe(story.pages.length + 4);
  });

  it("reflète le titre de l'histoire", () => {
    const doc = buildStoryDocument(histoire(8));
    expect(doc.props.title).toBe("Le voyage de Sami");
  });
});

describe("dédicace du parent et « imaginée par »", () => {
  it("le livre se construit avec ou sans, et le rendu PDF réel ne casse pas", async () => {
    const { renderStoryPdf } = await import("@/lib/pdf");
    const avec: Story = { ...histoire(4), dedicace: { texte: "Pour Sami, qui n'a peur de rien. Avec tout notre amour.", signature: "Papa et Maman" }, imaginePar: "Sami" };
    expect(countPages(buildStoryDocument(avec, "Sami"))).toBe(countPages(buildStoryDocument(histoire(4), "Sami")));
    const pdf = await renderStoryPdf(avec, "Sami");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
