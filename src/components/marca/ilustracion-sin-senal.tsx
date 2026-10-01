import Image from "next/image";

import { ILUSTRACIONES } from "@/lib/ilustraciones";

/**
 * El latido con ruido: la ilustracion de "sin conexion" y de "algo fallo".
 *
 * `unoptimized` a proposito: se pide por su ruta tal cual, que es la que el
 * service worker precachea al instalarse (public/sw.js). Una variante de
 * next/image tendria otra URL, y justo sin red no estaria guardada.
 *
 * Es decorativa: el texto de cada pantalla ya dice lo que pasa.
 */
export function IlustracionSinSenal({ ancho = 200 }: { ancho?: number }) {
  const { src, ancho: anchoArchivo, alto } = ILUSTRACIONES.latidoEcgRuido;
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={ancho}
      height={Math.round((ancho * alto) / anchoArchivo)}
      unoptimized
      priority
      data-ilustracion="latido-ecg-ruido"
    />
  );
}
