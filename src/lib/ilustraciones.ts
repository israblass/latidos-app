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
  nubesTecho: { src: "/ilustraciones/nubes-techo.webp", ancho: 560, alto: 234 },
} as const;

export type Ilustracion = (typeof ILUSTRACIONES)[keyof typeof ILUSTRACIONES];
