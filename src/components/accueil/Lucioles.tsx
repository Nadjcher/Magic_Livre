/**
 * Lucioles et étoiles qui scintillent : la « petite lumière qui guide » de la
 * bible, en fond de section. Positions fixes (pas d'aléatoire : rendu identique
 * serveur / navigateur). Coupé si l'utilisateur réduit les animations.
 */

const LUCIOLES = [
  [8, 72, 0, 9], [18, 34, 2.1, 11], [27, 82, 4.3, 10], [36, 18, 1.2, 12], [44, 64, 3.4, 9],
  [55, 40, 0.7, 13], [63, 86, 2.8, 10], [72, 22, 5.1, 11], [81, 58, 1.8, 12], [90, 30, 3.9, 9],
  [94, 76, 0.4, 14], [4, 44, 4.8, 10], [50, 12, 2.5, 12], [68, 70, 6.0, 11],
] as const;

const ETOILES = [
  [6, 10, 0], [14, 22, 1.4], [23, 6, 0.6], [31, 14, 2.2], [42, 8, 1.1], [58, 5, 2.8], [66, 16, 0.3],
  [77, 9, 1.9], [86, 18, 2.5], [95, 7, 0.9], [12, 30, 3.1], [88, 36, 1.6], [48, 24, 2.0], [74, 32, 3.4],
] as const;

export default function Lucioles({ nombre = LUCIOLES.length }: { nombre?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {ETOILES.map(([x, y, d], i) => (
        <span
          key={`e${i}`}
          className="etoile-ciel"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }}
        />
      ))}
      {LUCIOLES.slice(0, nombre).map(([x, y, d, duree], i) => (
        <span
          key={`l${i}`}
          className="luciole"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `-${d}s, -${d / 2}s`, animationDuration: `${duree}s, 2.6s` }}
        />
      ))}
    </div>
  );
}
