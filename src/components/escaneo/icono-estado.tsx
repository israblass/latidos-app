import Image from "next/image";

/**
 * Ilustracion de estado de los cierres de escaneo.
 *
 * Los assets ya traen su color y su forma: el check en verde, el candado en
 * gris neutro, el reloj con check en azul. Por eso van sueltos y no dentro del
 * circulo tintado que llevaban los iconos de trazo — un circulo de color detras
 * competiria con el color que la propia ilustracion usa para decir de que
 * estado se trata.
 */

/** Lado en pantalla. Next pide las variantes por DPR a partir de aqui. */
const LADO = 72;

export function IconoEstado({
  nombre,
  carpeta = "iconos",
  className,
}: {
  nombre: string;
  carpeta?: "iconos" | "estados-vacios";
  className?: string;
}) {
  return (
    <Image
      src={`/assets/${carpeta}/${nombre}.webp`}
      alt=""
      aria-hidden="true"
      width={LADO}
      height={LADO}
      className={className}
    />
  );
}
