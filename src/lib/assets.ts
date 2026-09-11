/**
 * Imagenes de marca de Latidos.
 *
 * Viven en el Supabase Storage compartido con la web (bucket
 * `imagenes-landing-ucv`) y se consumen por URL publica, sin copiarlas al
 * repo. Mismo patron que `src/lib/assets.ts` de la web, para que ambos
 * productos apunten al mismo archivo y un cambio de arte se refleje en los dos
 * sin tocar codigo.
 */

const BUCKET =
  "https://vbxccqtcqjzzsjvhryfs.supabase.co/storage/v1/object/public/imagenes-landing-ucv";

export const ASSETS = {
  /** Logotipo principal de Latidos. */
  latidosHero: `${BUCKET}/Latidos-hero.png`,

  /** Logos institucionales, para creditos. */
  flame: `${BUCKET}/flame-logo.png`,
  ucv: `${BUCKET}/Logo-UCV.png`,
  munUcv: `${BUCKET}/Logo-MUN-UCV.png`,

  /** Lettering de cada fase del programa. */
  letteringPulso: `${BUCKET}/pulso-lettering.png`,
  letteringEmpuje: `${BUCKET}/empuje-lettering.png`,
  letteringLateVenezuela: `${BUCKET}/late-venezuela-lettering.png`,
} as const;

export type ClaveAsset = keyof typeof ASSETS;
