/**
 * Interface de fournisseur d'illustrations (version ultérieure).
 *
 * Par défaut, aucune image n'est générée (IMAGE_PROVIDER=none). Le style
 * visuel unique est défini dans style_config.ts pour garder la cohérence
 * lorsque la génération d'images sera activée.
 *
 * Les photos d'enfants restent hors périmètre tant que le cadre juridique
 * n'est pas validé par un avocat : aucun upload de photo n'est prévu.
 */

import { STYLE_CONFIG } from "./style_config";

export interface IllustrationRequest {
  /** Description de la scène à illustrer (champ scene_illustration). */
  scene: string;
}

export interface IllustrationResult {
  /** URL de l'image générée, ou null si la génération est désactivée. */
  imageUrl: string | null;
}

export interface IllustrationProvider {
  readonly name: string;
  readonly enabled: boolean;
  generate(req: IllustrationRequest): Promise<IllustrationResult>;
}

/**
 * Implémentation « désactivée » : ne génère aucune image. C'est le fournisseur
 * par défaut. Il applique tout de même le style de style_config pour préparer
 * une future activation.
 */
class DisabledIllustrationProvider implements IllustrationProvider {
  readonly name = "none";
  readonly enabled = false;

  async generate(_req: IllustrationRequest): Promise<IllustrationResult> {
    // Le style serait appliqué ici lors d'une future activation :
    void STYLE_CONFIG.illustration.styleDescription;
    return { imageUrl: null };
  }
}

/**
 * Sélectionne le fournisseur d'illustrations selon la configuration.
 * Aujourd'hui seul « none » est disponible.
 */
export function getIllustrationProvider(): IllustrationProvider {
  // IMAGE_PROVIDER n'est lu que côté serveur ; par défaut « none ».
  return new DisabledIllustrationProvider();
}
