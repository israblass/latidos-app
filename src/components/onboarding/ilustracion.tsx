import Image from "next/image";

/**
 * Ilustracion de una pantalla del onboarding.
 *
 * Los archivos vienen en 9:16 con el tercio inferior vacio a proposito: el arte
 * va arriba y el copy debajo, no encima. Por eso no se centran verticalmente.
 *
 * Ese tercio vacio se recorta con un contenedor mas bajo que la imagen y
 * `object-top`. Dejarlo entero costaria un tercio del alto de la pantalla en
 * espacio transparente, y en un telefono eso empuja el copy y el boton fuera de
 * la vista.
 */

/** Proporcion del arte, ya sin el tercio vacio de abajo. */
const PROPORCION = "752 / 920";

export function IlustracionOnboarding({
  nombre,
  descripcion,
}: {
  /** Nombre del archivo sin extension, dentro de /assets/ilustraciones. */
  nombre: string;
  /** Que se ve. Vacio si la ilustracion solo acompaña al texto de al lado. */
  descripcion: string;
}) {
  return (
    <div
      className="relative mx-auto w-full max-w-[280px] overflow-hidden"
      style={{ aspectRatio: PROPORCION }}
    >
      <Image
        src={`/assets/ilustraciones/${nombre}.webp`}
        alt={descripcion}
        fill
        priority
        sizes="280px"
        className="object-contain object-top"
      />
    </div>
  );
}
