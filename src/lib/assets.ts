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

/*
 * Assets de marca que ya estan en public/assets pero todavia no tienen pantalla
 * donde vivir. Se anotan aqui para que no se pierdan de vista al construir las
 * fases que faltan:
 *
 * - fondos/fondo-header-perfil       -> cabecera de Perfil (tab aun sin pantalla)
 * - fondos/fondo-banner-publicitario -> slot de banner en Inicio (Fase 1 constitution)
 * - fondos/fondo-notificacion        -> arte de las push (Fase 2)
 * - fondos/fondo-feature-graphic     -> ficha de las tiendas, no va dentro de la app
 * - badges/*                         -> niveles de logro (sistema aun no construido)
 * - iconos/icono-canjear, icono-qr-personal, icono-centro-acopio,
 *   icono-configuracion, icono-cerrar-sesion -> Perfil, Pulso y canje (fases 2 y 3)
 * - iconos/icono-exito-check, icono-codigo-inactivo, icono-ya-escaneado,
 *   icono-marco-escaneo-solido -> pantallas de escaneo; hoy usan SVG en linea
 *   que ya pasan contraste. Sustituirlos es cosmetico y se hara en el Frente 3.
 * - estados-vacios/vacio-sin-jornadas, -sin-escaneos, -sin-notificaciones,
 *   -sin-conexion -> pantallas de lista que aun no existen.
 *
 * Y lo que falta y hace falta:
 *
 * - TODO(assets) iconos/icono-notificacion    -> card "Avisos del programa"
 * - TODO(assets) ilustraciones/onboarding-3-* -> tercera pantalla del onboarding
 * - TODO(assets) el sexto estado vacio        -> sin asignar
 */
