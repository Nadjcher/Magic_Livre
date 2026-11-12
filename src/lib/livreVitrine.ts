/**
 * Le livre d'exemple de la page d'accueil : « La lanterne de Léo », dans le
 * style de la maison. Léo est un enfant fictif (photo générée, aucun enfant réel).
 * Images dans /public/vitrine.
 */

export const RITOURNELLE = "« Petite lueur, montre-moi le chemin. »";

export const LIVRE_VITRINE = {
  titre: "La lanterne de Léo",
  couverture: "/vitrine/couverture.webp",
  photo: "/exemple/photo.webp",
  portrait: "/vitrine/portrait.webp",
  pages: [
    {
      image: "/vitrine/page1.webp",
      alt: "Léo dans son lit serre son ours Caramel, la chambre est sombre",
      texte:
        "Ce soir, la veilleuse de Léo n'éclaire plus qu'un tout petit coin. Autour, la chambre est toute noire. Léo serre Caramel, son ours, très fort contre lui.",
    },
    {
      image: "/vitrine/page2.webp",
      alt: "Léo regarde une lueur dorée sous l'armoire",
      texte: `Sous l'armoire, une lueur clignote. Une fois. Deux fois. Léo glisse un œil hors de sa couette et murmure : ${RITOURNELLE}`,
    },
    {
      image: "/vitrine/page3.webp",
      alt: "Une minuscule luciole posée sur le doigt de Léo",
      texte:
        "C'est Lulu, une luciole minuscule et très bavarde. « Ma lumière s'en va, chuchote-t-elle. Sans elle, je ne retrouve plus ma maison ! »",
    },
    {
      image: "/vitrine/page4.webp",
      alt: "Léo marche sur la pointe des pieds dans le jardin la nuit, guidé par la luciole",
      texte: `Léo ouvre la fenêtre. Sur la pointe des pieds, Caramel sous le bras, il suit Lulu dans le jardin. Les fougères bruissent. ${RITOURNELLE}`,
    },
    {
      image: "/vitrine/page5.webp",
      alt: "Léo dessine une lanterne au crayon blanc, elle s'allume pour de vrai",
      texte:
        "Lulu n'éclaire presque plus. Alors Léo a une idée. Avec son crayon blanc, il dessine une lanterne sur la mousse… et la lanterne s'allume pour de vrai !",
    },
    {
      image: "/vitrine/page6.webp",
      alt: "Léo endormi avec son ours, la lanterne dessinée veille sur la fenêtre",
      texte: `Lulu est rentrée chez elle. La lanterne veille sur le rebord de la fenêtre. Léo s'endort, Caramel dans les bras, et chuchote encore : ${RITOURNELLE}`,
    },
  ],
  soirs: [
    { image: "/vitrine/soir1.webp", alt: "Léo découvre, émerveillé, qu'il est le héros du livre" },
    { image: "/vitrine/soir2.webp", alt: "Un parent lit le livre à Léo, au coin de son lit" },
  ],
};
