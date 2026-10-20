/**
 * Avis de parents + note moyenne. Contenu illustratif (à remplacer par de vrais
 * avis avant le lancement). Cartes en relief, inclinables au pointeur.
 */

function Etoiles({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5 text-or" aria-label={`${n} étoiles sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4" fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z" />
        </svg>
      ))}
    </div>
  );
}

const AVIS = [
  {
    nom: "Camille",
    detail: "maman de Léa, 4 ans",
    couleur: "#6d3bd1",
    note: 5,
    texte:
      "Léa réclame « son » histoire tous les soirs. Se voir en héroïne de la forêt enchantée, ça n'a pas de prix.",
  },
  {
    nom: "Thomas",
    detail: "papa de Noé, 6 ans",
    couleur: "#39a58f",
    note: 5,
    texte:
      "On a imprimé le livre et le poster. Noé l'a montré à toute la classe. La version audio nous sauve les longs trajets.",
  },
  {
    nom: "Inès",
    detail: "maman de Sofia, 3 ans",
    couleur: "#d4698c",
    note: 5,
    texte:
      "Doux, rassurant, et vraiment personnalisé. J'aime qu'aucune photo ne soit conservée : je recommande les yeux fermés.",
  },
];

export default function Temoignages() {
  return (
    <section>
      <header className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Etoiles n={5} />
          <span className="font-semibold text-magique-texte">4,9 / 5</span>
        </div>
        <h2 className="mt-3 text-3xl sm:text-4xl">Les familles adorent le rituel</h2>
        <div className="ornement my-4" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z" />
          </svg>
        </div>
      </header>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {AVIS.map((a) => (
          <figure key={a.nom} data-tilt className="carte-relief flex h-full flex-col p-6">
            <Etoiles n={a.note} />
            <blockquote className="relief-milieu mt-3 flex-1 text-[15px] leading-relaxed text-magique-texte">
              « {a.texte} »
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span
                className="relief-avant flex h-10 w-10 flex-none items-center justify-center rounded-full font-serif font-semibold text-white"
                style={{ backgroundColor: a.couleur }}
                aria-hidden="true"
              >
                {a.nom.charAt(0)}
              </span>
              <span className="leading-tight">
                <span className="block font-semibold text-magique-texte">{a.nom}</span>
                <span className="block text-sm text-magique-texteClair">{a.detail}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
