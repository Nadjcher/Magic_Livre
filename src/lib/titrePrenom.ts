/**
 * Titres avec le prénom de l'enfant : « Le Noël magique de Léo ».
 * Utilisable côté client et serveur.
 */

/** « de Léo » ou « d'Emma » (élision devant une voyelle ou un h). */
export function dePrenom(prenom: string): { de: string; nom: string } {
  const nom = prenom.trim();
  return { de: /^[aeiouyhàâäéèêëîïôöûùü]/i.test(nom) ? "d’" : "de ", nom };
}

/** Titre de couverture d'un thème, tourné pour accueillir « de Prénom ». */
const TITRES_COUVERTURE: Record<string, string> = {
  "boucle-d-or": "Les trois ours",
  "haricot-magique": "Le haricot magique",
  "hansel-gretel": "La maison en pain d’épices",
  "musiciens-breme": "L’orchestre des animaux",
  "lievre-tortue": "La grande course",
  "alice-merveilles": "Le pays des merveilles",
  pinocchio: "Le pantin de bois",
  "ali-baba": "La caverne aux trésors",
  "livre-jungle": "La grande jungle",
  "robin-des-bois": "La forêt de Sherwood",
  anniversaire: "L’anniversaire extraordinaire",
  halloween: "La nuit d’Halloween",
  "surprise-parents": "La grande surprise",
  rentree: "Le premier jour d’école",
  "petit-frere": "Le nouveau bébé",
  velo: "Le premier vélo",
  pot: "Le grand adieu aux couches",
  "grand-lit": "Le grand lit",
  demenagement: "La nouvelle maison",
  docteur: "La visite chez le docteur",
  "peur-du-noir": "La nuit étoilée",
  timidite: "Le grand courage",
  confiance: "Le grand défi",
  dinosaures: "Le voyage chez les dinosaures",
  espace: "La mission dans les étoiles",
  pirates: "Le trésor des pirates",
  "super-heros": "Les super-pouvoirs",
  safari: "Le grand safari",
  danse: "Le grand spectacle",
  cuisine: "La cuisine magique",
  pompier: "Le camion de pompiers",
  animal: "Le meilleur ami",
};

export function titreCouvertureTheme(themeId: string, titre: string): string {
  return TITRES_COUVERTURE[themeId] ?? titre;
}

/**
 * Sépare un titre qui se termine par le prénom (« Le hoquet doré de Léo ») en
 * { debut: "Le hoquet doré", de: "de ", nom: "Léo" } ; null sinon.
 */
export function separerTitre(titre: string, prenom: string | null | undefined): { debut: string; de: string; nom: string } | null {
  if (!prenom?.trim()) return null;
  const echappe = prenom.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`^(.*\\S)\\s+(de\\s+|d['’]\\s?)(${echappe})\\s*[!.…]*$`, "iu").exec(titre.trim());
  if (!m) return null;
  return { debut: m[1] as string, de: (m[2] as string).startsWith("d'") || (m[2] as string).startsWith("d’") ? "d’" : "de ", nom: m[3] as string };
}
