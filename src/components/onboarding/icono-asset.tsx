import Image from "next/image";

/**
 * Icono de los assets de marca, para los bloques del onboarding.
 *
 * Van por next/image y no como <img> sueltos: los originales son 1024x1024 sin
 * perdida y pesan entre 150 y 500 KB cada uno. Aqui se ven a 26 px, asi que
 * servir el original seria mandar unas cien veces mas bytes de los que se
 * llegan a mirar. Next entrega la variante del tamaño que toca segun la
 * pantalla; medido, el mismo icono baja de 433 KB a 1,4 KB.
 */

/** Lado en pantalla. Next pide las variantes por DPR a partir de aqui. */
const LADO = 26;

export function IconoAsset({
  nombre,
  carpeta = "iconos",
}: {
  /** Nombre del archivo sin extension, dentro de /assets/<carpeta>. */
  nombre: string;
  carpeta?: "iconos" | "recompensas" | "badges";
}) {
  return (
    <Image
      src={`/assets/${carpeta}/${nombre}.webp`}
      alt=""
      width={LADO}
      height={LADO}
      // Decorativo: el titulo del bloque, al lado, ya dice lo mismo.
      aria-hidden="true"
    />
  );
}
