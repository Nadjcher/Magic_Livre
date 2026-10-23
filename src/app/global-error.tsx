"use client";

/**
 * Filet de sécurité ultime : capture même les erreurs du layout racine
 * (doit fournir ses propres <html>/<body>).
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#eef2fd",
          color: "#1b2250",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          margin: 0,
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28 }}>Oups, un pépin est survenu</h1>
          <p style={{ color: "#5b6598", maxWidth: 420 }}>
            Réessayez dans un instant. Si le problème persiste, revenez un peu plus tard.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 12,
              background: "linear-gradient(135deg,#4f6ef0,#8b5ae0)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "12px 28px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
