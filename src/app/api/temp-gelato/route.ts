/** TEMPORAIRE — commande BROUILLON d'essai chez Gelato (rien n'est imprimé). Protégé par empreinte de secret. À supprimer. */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { imagesDuLivre, deposerPdf, commanderGelato } from "@/lib/print";
import { renderPrintPdf } from "@/lib/printBook";
export const runtime = "nodejs";
export const maxDuration = 300;
const B = "https://storilou.vercel.app/exemple/";
export async function GET(req: Request): Promise<Response> {
  const s = new URL(req.url).searchParams.get("s") ?? "";
  if (createHash("sha256").update(s).digest("hex") !== "18c4fea5fe42247f9b1f1a9702b96774172ae59e36e5f4630d8b386cbec18a0f") return new NextResponse("Non.", { status: 404 });
  if (process.env.GELATO_MODE === "order") return NextResponse.json({ erreur: "mode production actif : essai annulé" });
  const t = Date.now();
  const etapes: Record<string, unknown> = {};
  try {
    const textes = [
      "Ce soir-là, Léo entre dans la forêt des lanternes avec Roux, son petit renard au foulard bleu.",
      "« Par ici ! » chuchote Roux. Ils traversent le pont des lucioles, sous une lune immense.",
      "Tout en haut de la colline, Léo libère les lanternes : le ciel s'illumine de mille étoiles.",
      "Roux saute de joie. « Tu as réveillé la forêt, Léo ! » Les arbres se mettent à briller.",
      "Sur le chemin du retour, les lucioles dessinent un cœur autour d'eux.",
      "Léo s'endort en souriant, une petite lanterne posée près de son lit.",
      "Et dans la forêt, une lanterne porte désormais son prénom.",
      "Fin du voyage, mais pas des rêves.",
    ];
    const imgs = [B + "page-pont.webp", B + "page-lanternes.webp", B + "couverture.webp"];
    const story = {
      titre: "Léo et la forêt des lanternes",
      couvertureUrl: B + "couverture.webp",
      pages: textes.map((x, i) => ({ texte: x, scene_illustration: "scene", imageUrl: imgs[i % 3] })),
      fiches: { heros: B + "photo.webp", cast: {} },
    };
    const images = await imagesDuLivre(story as never, "Léo", true);
    etapes.images = (Date.now() - t) / 1000;
    const pdf = await renderPrintPdf(story as never, "Léo", images);
    etapes.pdfMo = Math.round(pdf.length / 1e5) / 10;
    etapes.pdf = (Date.now() - t) / 1000;
    const url = await deposerPdf(pdf, "storilou-essai-brouillon.pdf");
    etapes.fichier = url;
    etapes.gelato = await commanderGelato("ESSAI-" + Date.now(), "essai", url, {
      firstName: "Essai", lastName: "Storilou", addressLine1: "1 rue de Rivoli", city: "Paris", postCode: "75001",
      country: "FR", email: "essai@example.com",
    });
  } catch (e) {
    etapes.erreur = String(e).slice(0, 500);
  }
  etapes.s = (Date.now() - t) / 1000;
  return NextResponse.json(etapes);
}
