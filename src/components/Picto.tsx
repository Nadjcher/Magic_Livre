/**
 * Petit dessin peint (remplace les émojis utilisés comme icônes).
 * Fichiers : /public/pictos/<groupe>/<id>.webp (192 px, fond transparent).
 * Si le dessin n'existe pas (thème ajouté plus tard…), on affiche l'émoji de secours.
 */

const DISPONIBLES = new Set([
  "categories/aventures",
  "categories/classiques",
  "categories/emotions",
  "categories/fetes",
  "categories/grandir",
  "categories/passions",
  "extras/coloriage",
  "extras/invitation",
  "extras/marque-pages",
  "extras/poster",
  "extras/stickers",
  "formats/album",
  "formats/aventure",
  "formats/bd",
  "formats/cherche",
  "formats/comptine",
  "formats/dodo",
  "formats/drole",
  "formats/enquete",
  "formats/fantasy",
  "formats/imagier",
  "formats/manga",
  "formats/realiste",
  "formats/roman",
  "formats/scifi",
  "offres/affiche",
  "offres/club",
  "offres/ecran",
  "offres/fete",
  "offres/imprime",
  "offres/pdf",
  "offres/tout",
  "offres/video",
  "themes/ali-baba",
  "themes/alice-merveilles",
  "themes/animal",
  "themes/anniversaire",
  "themes/boucle-d-or",
  "themes/chaperon-rouge",
  "themes/chat-botte",
  "themes/chevaliers",
  "themes/colere",
  "themes/confiance",
  "themes/cuisine",
  "themes/danse",
  "themes/demenagement",
  "themes/dinosaures",
  "themes/docteur",
  "themes/espace",
  "themes/foot",
  "themes/foret-enchantee",
  "themes/grand-lit",
  "themes/halloween",
  "themes/hansel-gretel",
  "themes/haricot-magique",
  "themes/licornes",
  "themes/lievre-tortue",
  "themes/livre-jungle",
  "themes/magicien-oz",
  "themes/musiciens-breme",
  "themes/noel",
  "themes/ocean",
  "themes/paques",
  "themes/partage",
  "themes/petit-frere",
  "themes/petit-poucet",
  "themes/petite-souris",
  "themes/peur-du-noir",
  "themes/pinocchio",
  "themes/pirates",
  "themes/pompier",
  "themes/pot",
  "themes/rentree",
  "themes/robin-des-bois",
  "themes/safari",
  "themes/super-heros",
  "themes/surprise-parents",
  "themes/timidite",
  "themes/trois-petits-cochons",
  "themes/velo",
  "themes/vilain-petit-canard",
]);

export function pictoExiste(cle: string): boolean {
  return DISPONIBLES.has(cle);
}

export default function Picto({
  cle,
  secours,
  taille = 48,
  className = "",
}: {
  /** ex. "themes/noel", "formats/album", "offres/imprime" */
  cle: string;
  /** émoji affiché si le dessin n'existe pas */
  secours?: string;
  taille?: number;
  className?: string;
}) {
  if (!DISPONIBLES.has(cle)) {
    return secours ? (
      <span aria-hidden="true" className={className} style={{ fontSize: Math.round(taille * 0.6), lineHeight: 1 }}>
        {secours}
      </span>
    ) : null;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/pictos/${cle}.webp`}
      alt=""
      aria-hidden="true"
      width={taille}
      height={taille}
      loading="lazy"
      decoding="async"
      className={`shrink-0 select-none object-contain ${className}`}
      style={{ width: taille, height: taille }}
    />
  );
}
