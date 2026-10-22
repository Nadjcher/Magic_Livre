import { test, expect } from "@playwright/test";

/**
 * Test de bout en bout du parcours.
 *
 * Deux niveaux :
 *  1. Un parcours « public » qui vérifie les pages d'accueil, les pages légales
 *     et la protection des routes privées (toujours exécuté).
 *  2. Le parcours complet (connexion par lien magique, création, lecture,
 *     paiement en mode test Stripe) exécuté uniquement lorsque E2E_FULL=1 et
 *     que la base de test + les clés Stripe de test sont configurées. Il
 *     récupère le lien magique directement en base (table VerificationToken),
 *     car aucun mot de passe n'existe.
 */

test.describe("Parcours public", () => {
  test("affiche l'accueil et ses garanties", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /livres magiques/i }),
    ).toBeVisible();
    await expect(page.getByText(/Personnages originaux/i)).toBeVisible();
    await expect(page.getByText(/Aucune photo demandée/i)).toBeVisible();
    await expect(page.getByText(/Consentement parental/i)).toBeVisible();
  });

  test("les pages légales sont accessibles", async ({ page }) => {
    await page.goto("/mentions-legales");
    await expect(page.getByRole("heading", { name: /Mentions légales/i })).toBeVisible();
    await page.goto("/cgu");
    await expect(
      page.getByRole("heading", { name: /Conditions générales/i }),
    ).toBeVisible();
    await page.goto("/confidentialite");
    await expect(
      page.getByRole("heading", { name: /Politique de confidentialité/i }),
    ).toBeVisible();
  });

  test("les routes privées redirigent vers la connexion", async ({ page }) => {
    await page.goto("/creer");
    await expect(page).toHaveURL(/\/connexion/);
    await page.goto("/bibliotheque");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("la page de connexion propose le lien magique", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.getByLabel(/Adresse email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Recevoir le lien/i }),
    ).toBeVisible();
  });
});

/**
 * Parcours complet. Activé avec E2E_FULL=1.
 *
 * Prérequis :
 *  - base de données de test accessible via DATABASE_URL ;
 *  - clés Stripe en mode test (carte 4242 4242 4242 4242) ;
 *  - serveur de développement lancé (géré par playwright.config.ts).
 */
test.describe("Parcours complet (Stripe test)", () => {
  test.skip(
    process.env.E2E_FULL !== "1",
    "Parcours complet désactivé (définir E2E_FULL=1 avec une base et des clés Stripe de test).",
  );

  test("création, lecture et paiement", async ({ page }) => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const email = `e2e-${Date.now()}@exemple.test`;

    try {
      // 1. Demande d'un lien magique.
      await page.goto("/connexion");
      await page.getByLabel(/Adresse email/i).fill(email);
      await page.getByRole("button", { name: /Recevoir le lien/i }).click();
      await expect(page.getByText(/lien de connexion/i)).toBeVisible();

      // 2. Récupération du jeton en base et visite du lien magique.
      const token = await prisma.verificationToken.findFirst({
        where: { identifier: email },
        orderBy: { expires: "desc" },
      });
      expect(token, "jeton de connexion introuvable").toBeTruthy();
      const callbackUrl = `/api/auth/callback/nodemailer?token=${token!.token}&email=${encodeURIComponent(
        email,
      )}`;
      await page.goto(callbackUrl);

      // 3. Consentement parental sur la page de création.
      await page.goto("/creer");
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: /consentement/i }).click();

      // 4. Ajout d'un enfant.
      await page.goto("/enfants");
      await page.getByLabel(/Prénom/i).first().fill("Sami");
      await page.getByLabel(/^Âge$/i).first().fill("5");
      await page.getByRole("button", { name: /^Ajouter$/i }).click();

      // 5. Création d'un livre en mode aventure libre.
      await page.goto("/creer");
      await page.getByRole("button", { name: /Aventure libre/i }).click();
      await page.getByLabel(/Décrivez l'aventure/i).fill(
        "Sami part acheter le pain et aide un chat perdu.",
      );
      await page.getByRole("button", { name: /Créer le livre/i }).click();

      // 6. Lecture : le lecteur affiche la couverture.
      await expect(page.getByText(/Tournez la page/i)).toBeVisible({ timeout: 90_000 });

      // 7. Paiement en mode test Stripe.
      await page.getByRole("button", { name: /Télécharger le PDF/i }).click();
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
      // Le remplissage de la carte test dépend de l'UI Stripe ; voir le README.
    } finally {
      await prisma.user.deleteMany({ where: { email } }).catch(() => undefined);
      await prisma.$disconnect();
    }
  });
});
