/**
 * Le livre d'exemple de la page d'accueil : « La petite lueur de Léo »
 * (illustrations 3D). Léo est un enfant fictif (photo générée, aucun enfant réel).
 * Écrit selon la bible : un objet de l'enfant (Caramel), une petite lumière qui
 * guide, trois essais dont de vrais échecs, la solution vient de l'enfant, une
 * ritournelle trois fois mot pour mot, retour au lit et accroche pour la suite.
 * Images dans /public/vitrine.
 */

export const RITOURNELLE = "« Petite lueur, ne t'éteins pas. »";

export const LIVRE_VITRINE = {
  titre: "La petite lueur de Léo",
  couverture: "/vitrine/couverture.webp",
  photo: "/exemple/photo.webp",
  portrait: "/vitrine/portrait.webp",
  pages: [
    {
      image: "/vitrine/page1.webp",
      alt: "Léo dans son lit serre son ours Caramel, la veilleuse est éteinte",
      texte:
        "Ce soir, la veilleuse de Léo fait clic… et s'éteint. Le coin de la chambre devient tout noir. Léo serre Caramel, son ours, tout contre son cœur.",
    },
    {
      image: "/vitrine/page2.webp",
      alt: "Léo, penché au bord du lit, découvre une lueur dorée près de l'armoire",
      texte: `Près de l'armoire, une lueur dorée clignote. Une fois. Deux fois. De plus en plus faible. Léo se penche et chuchote : ${RITOURNELLE}`,
    },
    {
      image: "/vitrine/page3.webp",
      alt: "Une minuscule luciole posée au creux de la main de Léo",
      texte:
        "C'est Lulu, une luciole pas plus grande qu'un bouton, et très bavarde. « J'ai trop joué dehors, j'ai usé ma lumière, et sans elle je ne retrouve plus ma maison ! »",
    },
    {
      image: "/vitrine/page4.webp",
      alt: "Léo souffle doucement sur la luciole presque éteinte dans ses mains",
      texte: `Léo souffle tout doucement sur elle : rien. Il la pose près de sa veilleuse : rien non plus. Lulu soupire. Léo ferme les yeux très fort : ${RITOURNELLE}`,
    },
    {
      image: "/vitrine/page5.webp",
      alt: "Léo serre son ours contre lui, la luciole brille de nouveau dans sa fourrure",
      texte:
        "Alors Léo a une idée. Il installe Lulu dans la fourrure de Caramel et les serre tous les deux, bien au chaud. Tout contre son cœur, une lueur s'allume… puis brille, brille !",
    },
    {
      image: "/vitrine/page6.webp",
      alt: "Léo, dans son lit, fait au revoir à la luciole qui s'envole par la fenêtre",
      texte: `Lulu fait trois tours de chambre pour dire merci, puis s'envole vers le jardin. Léo bâille, Caramel dans les bras. Dehors, une petite lumière clignote. Elle reviendra demain.`,
    },
  ],
  soirs: [
    { image: "/vitrine/soir1.webp", alt: "Léo découvre, émerveillé, qu'il est le héros du livre" },
    { image: "/vitrine/soir2.webp", alt: "Un parent lit le livre à Léo, au coin de son lit" },
  ],
};
