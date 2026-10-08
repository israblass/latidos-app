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

  /** Lettering de cada fase del programa. */
  letteringPulso: `${BUCKET}/pulso-lettering.png`,
  letteringEmpuje: `${BUCKET}/empuje-lettering.png`,
  letteringLateVenezuela: `${BUCKET}/late-venezuela-lettering.png`,
} as const;

export type ClaveAsset = keyof typeof ASSETS;

/**
 * Variantes del logo para la bienvenida (constitution §2, v2.10.0), servidas
 * desde public/marca y generadas con scripts/logo-variantes.py a partir del
 * logo oficial (recursos/marca). Todas llevan un aro blanco detras del sello
 * UCV. 416 x 156 (3x de los 52px con que se muestran).
 */
export const LOGOS = {
  /** Oficial (wordmark azul) con aro: pantallas 1, 3 y 4. */
  aro: { src: "/marca/logo-latidos-aro.webp", respaldo: "/marca/logo-latidos-aro.png" },
  /** Wordmark blanco con aro: sobre el amarillo pleno de la pantalla 2. */
  blancoAro: { src: "/marca/logo-latidos-blanco-aro.webp", respaldo: "/marca/logo-latidos-blanco-aro.png" },
  /** Wordmark navy con aro: alternativa para el amarillo pleno. */
  navyAro: { src: "/marca/logo-latidos-navy-aro.webp", respaldo: "/marca/logo-latidos-navy-aro.png" },
} as const;

export const ANCHO_LOGO = 416;
export const ALTO_LOGO = 156;

/**
 * Wordmark sobre el amarillo pleno (pantalla 2 de la bienvenida). Pedido de
 * Isra: blanco. Ojo: blanco sobre #FDFB05 da ~1.06:1; se lee por tamaño, no
 * por contraste. Para pasar a navy (~15:1) basta con cambiar esta constante.
 */
export const LOGO_AMARILLO: "blanco" | "navy" = "blanco";

export const logoSobreAmarillo = () => (LOGO_AMARILLO === "blanco" ? LOGOS.blancoAro : LOGOS.navyAro);

/**
 * Logos de los aliados en el pie de la bienvenida (v2.10.1), servidos desde
 * public/marca/pie (logos-pie-v3/final): The Flame Creative Lab y el sello de
 * la UCV, en negro de una sola tinta por pedido de la diseñadora (MUN UCV se
 * retiro por pedido del cliente). Los archivos ya vienen en negro: no se
 * recolorean ni se deforman, solo se escalan. Ancho y alto son los del
 * archivo, para reservar su proporcion antes de que carguen.
 *
 * - El sello de la UCV es un redibujo (hecho con IA a partir del oficial), NO
 *   el archivo oficial: falta la aprobacion de la UCV (o de Kevin) o el vector.
 * - Flame es una ampliacion de una fuente pequeña: se reemplaza con el mismo
 *   nombre de archivo cuando llegue el vector original.
 */
export const LOGOS_PIE = {
  flame: { src: "/marca/pie/logo-flame-negro.webp", ancho: 1488, alto: 432, alt: "The Flame Creative Lab" },
  ucv: { src: "/marca/pie/logo-ucv-negro.webp", ancho: 1024, alto: 1024, alt: "Universidad Central de Venezuela" },
} as const;

/*
 * Assets de marca que ya estan en public/assets pero todavia no tienen pantalla
 * donde vivir. Se anotan aqui para que no se pierdan de vista al construir las
 * fases que faltan:
 *
 * - fondos/fondo-header-perfil       -> cabecera de Perfil (tab aun sin pantalla)
 * - fondos/fondo-notificacion        -> arte de las push (Fase 2)
 * - fondos/fondo-feature-graphic     -> ficha de las tiendas, no va dentro de la app
 * - badges/*                         -> niveles de logro (sistema aun no construido)
 * - iconos/icono-canjear, icono-qr-personal, icono-centro-acopio,
 *   icono-configuracion, icono-cerrar-sesion -> Perfil, Pulso y canje (fases 2 y 3)
 * - iconos/icono-exito-check, icono-codigo-inactivo, icono-ya-escaneado,
 *   icono-marco-escaneo-solido -> pantallas de escaneo; hoy usan SVG en linea
 *   que ya pasan contraste. Sustituirlos es cosmetico y se hara en el Frente 3.
 *
 * Las ilustraciones ya no viven aqui: las definitivas estan en
 * src/lib/ilustraciones.ts (archivos en public/ilustraciones). Las provisionales
 * de assets/ilustraciones y assets/estados-vacios se borraron al llegar.
 * Para los estados vacios que falten, la guia de la ilustradora sugiere
 * figura-amarilla-corazon (recursos/ilustraciones/LEEME.md).
 *
 * Y lo que falta y hace falta:
 *
 * - TODO(assets) iconos/icono-notificacion    -> card "Avisos del programa"
 */
