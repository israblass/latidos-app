import Image from "next/image";

/**
 * Ilustracion de una pantalla del onboarding.
 *
 * Se dimensiona por ALTO y no por ancho, con el ancho libre. Las dos
 * ilustracion que existen tienen formas muy distintas —la de comunidad es
 * 1:1.17 y la de escanear 1:1.94—, asi que fijar el ancho las dejaria con
 * alturas que no se parecen y cada slide pesaria distinto. Fijando el alto,
 * todas ocupan la misma franja de pantalla.
 *
 * Se usan las versiones `-recortada`, sin el borde transparente del original.
 * El recorte no es cosmetico: ese vacio es parte de la imagen, asi que
 * cualquier caja que la contenga lo sigue reservando, y era el hueco muerto que
 * quedaba entre la ilustracion y la card. Si llega una ilustracion nueva, hay
 * que recortarla igual o entregarla ya ajustada a su arte.
 *
 * El alto se encoge con la pantalla: en un telefono corto la ilustracion cede
 * espacio antes que empujar el boton de avanzar fuera de la vista.
 */
export function IlustracionOnboarding({
  nombre,
  descripcion,
}: {
  /** Nombre del archivo sin extension ni el sufijo `-recortada`. */
  nombre: string;
  /** Que se ve. */
  descripcion: string;
}) {
  return (
    <Image
      src={`/assets/ilustraciones/${nombre}-recortada.webp`}
      alt={descripcion}
      width={716}
      height={836}
      priority
      sizes="(max-height: 700px) 30vh, 40vh"
      className="mx-auto h-[clamp(108px,19vh,176px)] w-auto"
    />
  );
}
