import { ImageResponse } from "next/og";

/**
 * Image de partage (Open Graph / réseaux sociaux), générée dynamiquement aux
 * couleurs de la marque « Nuit enchantée ». 1200 × 630, rendu à la volée :
 * aucun fichier binaire à maintenir.
 */
export const runtime = "nodejs";
export const alt = "Mon Livre Magique — livres illustrés personnalisés pour enfants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          textAlign: "center",
          color: "#fdfbff",
          background: "linear-gradient(145deg, #23356f 0%, #16245c 55%, #0f1a44 100%)",
          position: "relative",
        }}
      >
        {/* Halos doux (cercles translucides, compatibles Satori) */}
        <div style={{ position: "absolute", top: -120, right: -60, width: 460, height: 460, borderRadius: 460, background: "rgba(91,155,255,0.30)" }} />
        <div style={{ position: "absolute", bottom: -160, left: -80, width: 480, height: 480, borderRadius: 480, background: "rgba(224,124,192,0.20)" }} />
        {/* Lune en croissant (deux cercles superposés) */}
        <div style={{ position: "absolute", top: 70, right: 110, width: 96, height: 96, borderRadius: 96, background: "#fdfbff", display: "flex" }} />
        <div style={{ position: "absolute", top: 62, right: 86, width: 88, height: 88, borderRadius: 88, background: "#16245c", display: "flex" }} />
        {/* Étoiles */}
        <div style={{ position: "absolute", top: 140, left: 130, width: 16, height: 16, borderRadius: 16, background: "#f6b8e0" }} />
        <div style={{ position: "absolute", top: 230, left: 90, width: 10, height: 10, borderRadius: 10, background: "#8b5ae0" }} />
        <div style={{ position: "absolute", bottom: 150, right: 200, width: 12, height: 12, borderRadius: 12, background: "#6f8bff" }} />

        {/* Petite étoile décorative (carré pivoté : évite une police externe) */}
        <div style={{ width: 22, height: 22, background: "#f6b8e0", transform: "rotate(45deg)", borderRadius: 4, display: "flex" }} />
        <div style={{ fontSize: 78, fontWeight: 700, marginTop: 24, lineHeight: 1.05, display: "flex" }}>
          Mon Livre Magique
        </div>
        <div
          style={{
            fontSize: 36,
            marginTop: 28,
            color: "#dcd6f4",
            maxWidth: 820,
            lineHeight: 1.3,
            display: "flex",
          }}
        >
          Un conte illustré personnalisé, écrit pour votre enfant
        </div>
        <div
          style={{
            marginTop: 44,
            fontSize: 26,
            color: "#0f1a44",
            background: "linear-gradient(135deg, #a9c0ff, #c79bea)",
            padding: "14px 34px",
            borderRadius: 999,
            display: "flex",
            fontWeight: 700,
          }}
        >
          Lecture gratuite · PDF dès 4,99 €
        </div>
      </div>
    ),
    size,
  );
}
