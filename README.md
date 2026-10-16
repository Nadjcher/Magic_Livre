# Mon Livre Magique ✨

Application web permettant à des parents de créer des **livres illustrés
personnalisés** pour leurs enfants (3 à 10 ans), en français. Le parent saisit
le prénom et l'âge de son enfant, choisit un héros original ou décrit une
aventure libre, et l'application génère une histoire de 8 à 12 pages, lisible
page par page avec lecture à voix haute, puis exportable en PDF après paiement.

## Sommaire

- [Pile technique](#pile-technique)
- [Prérequis](#prérequis)
- [Installation locale](#installation-locale)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données & migrations Prisma](#base-de-données--migrations-prisma)
- [Lancement](#lancement)
- [Tests](#tests)
- [Configuration Stripe & webhook](#configuration-stripe--webhook)
- [Déploiement sur Vercel](#déploiement-sur-vercel)
- [Règles légales et de sécurité](#règles-légales-et-de-sécurité)
- [Étapes manuelles avant lancement](#étapes-manuelles-avant-lancement)

## Pile technique

- **Next.js 14 (App Router)** + **TypeScript strict** + **Tailwind CSS**
- **PostgreSQL** via **Prisma**
- **Auth.js (NextAuth v5)** — connexion par email (lien magique)
- Génération de texte : **API Anthropic (Claude)**, côté serveur uniquement
- Voix : **Web Speech API** du navigateur (option ElevenLabs via configuration)
- Illustrations : interface `IllustrationProvider`, désactivée par défaut
- Paiement : **Stripe Checkout** (paiement unique, webhook signé)
- PDF : **@react-pdf/renderer** (A4 paysage, une page par page d'histoire)
- Tests : **Vitest** (logique) et **Playwright** (bout en bout)

## Prérequis

- Node.js 18.18+ (ou 20+)
- Une base **PostgreSQL** (locale, ou hébergée : Supabase / Neon)
- Un compte **Anthropic** avec une clé API
- Un compte **Stripe** (mode test pour le développement)
- Un **serveur SMTP** pour l'envoi des liens magiques (en dev, un service de
  test comme Mailtrap convient)

## Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le modèle d'environnement et le compléter
cp .env.example .env
#    puis éditez .env (voir la section suivante)

# 3. Générer le client Prisma et appliquer le schéma
npm run prisma:generate
npm run prisma:migrate   # crée la première migration en dev
```

## Variables d'environnement

Toutes les variables sont décrites dans [`.env.example`](./.env.example).
Les clés sensibles (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, SMTP) restent **côté serveur** et ne sont jamais
exposées au navigateur.

Générez un secret d'authentification :

```bash
openssl rand -base64 32   # à placer dans AUTH_SECRET
```

## Base de données & migrations Prisma

```bash
# Développement : crée/applique les migrations et génère le client
npm run prisma:migrate

# Production : applique les migrations existantes
npm run prisma:deploy

# Explorer les données
npm run prisma:studio
```

Le schéma est défini dans [`prisma/schema.prisma`](./prisma/schema.prisma).
La suppression d'un utilisateur supprime **en cascade** ses enfants, livres et
commandes (RGPD).

## Lancement

```bash
npm run dev      # http://localhost:3000
npm run build    # build de production (génère aussi le client Prisma)
npm run start    # démarre le build de production
```

## Tests

```bash
npm run typecheck   # vérification des types
npm run test        # tests unitaires Vitest (filtres, validation, PDF…)
npm run test:e2e    # tests Playwright (parcours public par défaut)

# Parcours complet (connexion + création + paiement test Stripe) :
E2E_FULL=1 npm run test:e2e
```

Les tests unitaires couvrent : la liste des personnages protégés, le filtre de
contenu, la validation des entrées, la validation JSON du modèle et la
construction du PDF.

## Configuration Stripe & webhook

1. Créez un compte Stripe et récupérez la **clé secrète de test**
   (`sk_test_...`) → `STRIPE_SECRET_KEY`.
2. Installez le [Stripe CLI](https://stripe.com/docs/stripe-cli) et lancez :

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Le CLI affiche un secret `whsec_...` → `STRIPE_WEBHOOK_SECRET`.
3. En production, créez un **endpoint webhook** dans le dashboard Stripe pointant
   vers `https://VOTRE_DOMAINE/api/stripe/webhook`, en écoutant au minimum les
   événements `checkout.session.completed` et `checkout.session.expired`.
4. Carte de test : `4242 4242 4242 4242`, date future, CVC quelconque.

Le téléchargement du PDF **n'est débloqué qu'après** réception d'un webhook
`checkout.session.completed` validé par signature.

## Déploiement sur Vercel

1. Poussez le dépôt sur GitHub et importez-le dans Vercel.
2. Provisionnez une base **PostgreSQL** (Supabase ou Neon) et copiez sa chaîne
   de connexion dans `DATABASE_URL`.
3. Renseignez **toutes** les variables de `.env.example` dans les
   *Environment Variables* du projet Vercel.
4. Définissez `AUTH_URL` sur l'URL publique de production.
5. Appliquez les migrations Prisma sur la base de production
   (`npm run prisma:deploy`, par exemple via une étape de build ou en local
   pointant sur la base distante).
6. Configurez le webhook Stripe de production (voir ci-dessus).

## Règles légales et de sécurité

- **Personnages sous droits** : refusés via une liste de noms protégés
  (`src/lib/protectedCharacters.ts`). Jamais générés, même reformulés.
- **Photos d'enfants** : hors périmètre. Aucun upload de photo.
- **Consentement parental** : case explicite, enregistrée avec date + version
  des CGU. Aucune création sans consentement.
- **Filtre de contenu** : fonction isolée et testée
  (`src/lib/contentFilter.ts`), appliquée aux entrées **et** aux sorties.
- **Clés API** : uniquement côté serveur, via variables d'environnement.
- **RGPD** : données minimales, suppression du compte et des données associées.

## Étapes manuelles avant lancement

1. Créer les comptes **Anthropic** et **Stripe**, et provisionner la base
   **PostgreSQL** (Supabase/Neon).
2. Configurer un **serveur SMTP** pour les liens magiques.
3. Renseigner toutes les variables d'environnement (local + Vercel).
4. Créer l'**endpoint webhook Stripe** de production.
5. **Faire relire les CGU, les mentions légales et la politique de
   confidentialité par un avocat** avant d'ouvrir les paiements.
6. Compléter les champs entre crochets des pages légales (éditeur, hébergeur,
   contact).
7. Vérifier le **coût par livre** (appels IA) et fixer le prix en conséquence
   (`BOOK_PRICE_CENTS`).
8. Réaliser une **bêta fermée** avec quelques familles avant l'ouverture.

---

*Les illustrations générées sont prévues pour une version ultérieure
(`IMAGE_PROVIDER=none` par défaut). Le style visuel unique est centralisé dans
[`src/lib/style_config.ts`](./src/lib/style_config.ts).*
