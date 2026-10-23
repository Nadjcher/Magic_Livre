/**
 * Accès centralisé et typé aux variables d'environnement (côté serveur
 * uniquement). Aucune de ces valeurs ne doit être exposée au navigateur.
 */

import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example.`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

export const env = {
  // Anthropic
  anthropicApiKey: () => required("ANTHROPIC_API_KEY"),
  anthropicModel: () => optional("ANTHROPIC_MODEL", "claude-sonnet-4-5"),

  // Moteur de texte Groq (API compatible OpenAI, gratuit). On accepte aussi
  // l'ancienne variable ANTHROPIC_API_KEY comme source de clé, par commodité.
  groqApiKey: () => optional("GROQ_API_KEY", "") || optional("ANTHROPIC_API_KEY", ""),
  groqModel: () => optional("GROQ_MODEL", "openai/gpt-oss-120b"),
  groqVisionModel: () =>
    optional("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),

  // Stripe
  stripeSecretKey: () => required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => required("STRIPE_WEBHOOK_SECRET"),
  bookPriceCents: () => Number(optional("BOOK_PRICE_CENTS", "499")),
  // Prix de l'édition premium (illustrations haut de gamme).
  bookPricePremiumCents: () => Number(optional("BOOK_PRICE_PREMIUM_CENTS", "999")),
  bookCurrency: () => optional("BOOK_CURRENCY", "eur"),

  // Limites
  maxBooksPerDay: () => Number(optional("MAX_BOOKS_PER_DAY", "5")),

  // CGU
  termsVersion: () => optional("TERMS_VERSION", "2026-01-01"),

  // Voix / images
  voiceProvider: () => optional("VOICE_PROVIDER", "browser"),
  elevenLabsApiKey: () => optional("ELEVENLABS_API_KEY", ""),
  elevenLabsVoiceId: () => optional("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL"),
  // "none" (défaut, sûr) | "pollinations" (gratuit) | "gemini"
  imageProvider: () => optional("IMAGE_PROVIDER", "none"),
  geminiApiKey: () => optional("GEMINI_API_KEY", ""),
  geminiImageModel: () => optional("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image"),
  // Modèle « premium » (meilleure qualité/ressemblance, plus cher).
  geminiImageModelPremium: () =>
    optional("GEMINI_IMAGE_MODEL_PREMIUM", "gemini-3-pro-image"),

  // URL publique
  authUrl: () => optional("AUTH_URL", "http://localhost:3000"),
} as const;
