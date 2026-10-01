import Image from "next/image";

import type { Ilustracion } from "@/lib/ilustraciones";

/**
 * Ilustracion de una pantalla del onboarding.
 *
 * Se dimensiona por ALTO y no por ancho, con el ancho libre. Las ilustraciones
 * tienen formas muy distintas (el corazon es casi cuadrado, la figura amarilla
 * es el doble de alta que ancha), asi que fijar el ancho las dejaria con
 * alturas que no se parecen y cada slide pesaria distinto. Fijando el alto,
 * todas ocupan la misma franja de pantalla.
 *
 * Los archivos ya vienen recortados al arte, sin el borde transparente del
 * original: ese vacio es parte de la imagen, y cualquier caja que la contenga
 * lo seguiria reservando como hueco muerto entre la ilustracion y la card.
 *
 * El alto se encoge con la pantalla: en un telefono corto la ilustracion cede
 * espacio antes que empujar el boton de avanzar fuera de la vista.
 */
export function IlustracionOnboarding({
  ilustracion,
  descripcion,
}: {
  ilustracion: Ilustracion;
  /** Que se ve. */
  descripcion: string;
}) {
  return (
    <Image
      src={ilustracion.src}
      alt={descripcion}
      width={ilustracion.ancho}
      height={ilustracion.alto}
      priority
      sizes="(max-height: 700px) 30vh, 40vh"
      className="mx-auto h-[clamp(108px,19vh,176px)] w-auto"
    />
  );
}
