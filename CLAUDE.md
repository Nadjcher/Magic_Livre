# Encore une histoire — règles de travail

Livres personnalisés pour enfants (Next.js, Prisma/Neon, Vercel, images via fal).
Voir aussi `AGENTS.md` (règles Next.js).

## L'argent d'abord

- **Aucune dépense fal sans l'accord explicite du propriétaire**, avec le prix annoncé AVANT (images, relecture, tests).
- **Jamais plusieurs tests payants à la suite.** On fait toutes les corrections gratuites, puis UN seul test à la fin.
- Pas de livre entier en test : on teste la plus petite unité qui répond à la question (une image, une page).
- **Deux essais au plus** pour une même image. Si elle rate encore, on simplifie la scène (moins de personnages, doudou hors de l'image) au lieu de payer un troisième dessin.
- Donner le coût réel après chaque dépense (compteur `DepenseFal`), et le total du jour.

## Le contenu

- Le texte d'une histoire validée ne change pas sans l'accord du propriétaire. Les scènes à dessiner (anglais) peuvent être précisées.
- Les histoires toutes prêtes : texte 100 % validé, aucune phrase écrite par l'IA (`maitresseGenerateur.ts`).
- Les images des histoires toutes prêtes partent des **planches validées** (`planches.ts`) : seuls l'enfant et le doudou sont retouchés. Une planche se valide en la regardant en grand.
- Règles d'image communes dans `bibleVisuelle.ts` ; règles propres à une histoire dans sa fiche (`reglesImage`).
- Toute fiche passe le vérificateur gratuit (`ficheHistoire.ts`) avant la moindre image.
- Jamais de marque, de personnage connu ni de personnage protégé.

## La façon de coder

- Réfléchir avant de coder : lire le code existant, dire ce qu'on va changer et pourquoi.
- Faire simple : le plus petit changement qui répond à la demande. Ne pas élargir sans le dire.
- Changer seulement ce qui est demandé ; ne pas « améliorer » le reste au passage.
- Vérifier sans dépenser : `npx tsc --noEmit`, `npx vitest run`, `npm run build` avant chaque envoi.
- Routes de test temporaires : protégées par secret, retirées dès la fin du test.
- Jamais de secret (clé API) dans le code ni dans un commit.

## La communication

- Répondre en français, simplement, sans jargon.
- Dire honnêtement ce qui n'a pas marché, avec ce que ça a coûté.
- Montrer les images (avant/après) plutôt que les décrire.
