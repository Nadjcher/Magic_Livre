/** Écran d'attente instantané (« squelette ») pendant le chargement d'une page. */

export default function Squelette({ titre = true, cartes = 3, grille = false }: { titre?: boolean; cartes?: number; grille?: boolean }) {
  const bloc = "animate-pulse rounded-3xl bg-white/[0.07]";
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement">
      {titre && (
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-72 max-w-full animate-pulse rounded-2xl bg-white/10" />
        </div>
      )}
      <div className={grille ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
        {Array.from({ length: cartes }, (_, i) => (
          <div key={i} className={`${bloc} ${grille ? "h-64" : "h-28"}`} />
        ))}
      </div>
    </div>
  );
}
