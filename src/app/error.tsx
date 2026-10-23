"use client";

/**
 * Page d'erreur conviviale (remplace le « Application error » brut de Next).
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-20 text-center">
      <h1 className="font-serif text-3xl">Oups, un petit pépin ✦</h1>
      <p className="text-magique-texteClair">
        Une erreur est survenue de notre côté. Réessayez dans un instant — vos données sont en sécurité.
      </p>
      <button onClick={() => reset()} className="btn-primaire">
        Réessayer
      </button>
    </div>
  );
}
