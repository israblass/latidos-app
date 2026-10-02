/**
 * Ilustraciones de la app (las definitivas de la ilustradora).
 *
 * Los originales viven en recursos/ilustraciones/hd y no se publican. Lo que
 * se sirve son los tamaños de public/ilustraciones: recortados al arte (sin el
 * borde transparente) y a lo sumo al doble del tamaño con que se muestran.
 * Ancho y alto son los del archivo, para que next/image reserve el espacio
 * justo y la pantalla no salte al cargar.
 *
 * Para regenerarlos: recortar el borde transparente del archivo de hd/ y
 * reducirlo a la medida de aqui, en webp.
 */
export const ILUSTRACIONES = {
  /** Sin conexion y error. La precachea el service worker (public/sw.js). */
  latidoEcgRuido: { src: "/ilustraciones/latido-ecg-ruido.webp", ancho: 480, alto: 154 },
  corazonLatido: { src: "/ilustraciones/corazon-latido.webp", ancho: 362, alto: 352 },
  cajaCorazon: { src: "/ilustraciones/caja-corazon.webp", ancho: 422, alto: 352 },
  figuraAmarillaCorazon: { src: "/ilustraciones/figura-amarilla-corazon.webp", ancho: 183, alto: 352 },
  donacionesCajasBandera: { src: "/ilustraciones/donaciones-cajas-bandera.webp", ancho: 205, alto: 192 },
  corazonGorroNavidad: { src: "/ilustraciones/corazon-gorro-navidad.webp", ancho: 207, alto: 192 },
  estadioBeisbol: { src: "/ilustraciones/estadio-beisbol.webp", ancho: 251, alto: 192 },
  /** Avatar de la pildora de perfil del Inicio (v2.7.0), a 46px de alto. */
  corazonAudifonos: { src: "/ilustraciones/corazon-audifonos.webp", ancho: 80, alto: 92 },
  nubesTecho: { src: "/ilustraciones/nubes-techo.webp", ancho: 560, alto: 234 },

  /*
   * Bienvenida (constitution §2, v2.10.0). Cada archivo mide a lo sumo el
   * doble de su ancho en el lienzo de 390 x 430 de la pantalla. Los circulos
   * y el corazon tienen version propia: las del Inicio y el onboarding son
   * mas chicas que lo que aqui se muestra. Los circulos se quedan en 1.45x
   * (no 2x): van al 55% de opacidad y a 2x pesarian 275 KB en la primera
   * pantalla.
   */
  circulosPulsoBienvenida: { src: "/ilustraciones/circulos-pulso-bienvenida.webp", ancho: 900, alto: 901 },
  corazonLatidoBienvenida: { src: "/ilustraciones/corazon-latido-bienvenida.webp", ancho: 660, alto: 642 },
  ecgPulsoAncho: { src: "/ilustraciones/ecg-pulso-ancho.webp", ancho: 1120, alto: 335 },
  estadioUcv: { src: "/ilustraciones/estadio-ucv.webp", ancho: 1080, alto: 835 },
  parlanteCorazones: { src: "/ilustraciones/parlante-corazones.webp", ancho: 504, alto: 601 },
  mapaCampus: { src: "/ilustraciones/mapa-campus.webp", ancho: 1040, alto: 832 },
  estatuaUcv: { src: "/ilustraciones/estatua-ucv.webp", ancho: 340, alto: 942 },
  vitralUcv: { src: "/ilustraciones/vitral-ucv.webp", ancho: 1080, alto: 739 },
  velaCorazon: { src: "/ilustraciones/vela-corazon.webp", ancho: 234, alto: 683 },
} as const;

export type Ilustracion = (typeof ILUSTRACIONES)[keyof typeof ILUSTRACIONES];
