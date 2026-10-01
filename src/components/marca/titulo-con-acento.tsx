import type { ReactNode } from "react";

/**
 * Titulo en Anton con una barra amarilla corta debajo.
 *
 * Es la forma en que la app usa el amarillo de marca sobre fondo claro. El
 * `#FDFB05` no alcanza contraste como color de texto sobre superficies claras
 * (constitution §2), asi que deja de ser el color de la palabra y pasa a ser un
 * acento debajo: el texto va en navy, que se lee, y el amarillo sigue estando.
 *
 * Estaba repetido a mano en las cards de titulo del onboarding. Se extrae
 * porque ahora tambien lo usan las cards de Beats, que antes resolvian lo mismo
 * poniendo el amarillo sobre una card oscura.
 */

/**
 * La barra sola, para cuando el titulo no es un texto (un numero, por ejemplo).
 *
 * Regla del amarillo (constitution §2, v2.3.0): sobre crema o blanco el
 * `#FDFB05` queda en 1.1:1, asi que nunca va como linea fina. La barra es una
 * pastilla de 10px con un canto navy suave: se lee como forma y no como un
 * trazo que desaparece.
 */
export function BarraAcento({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`mx-auto h-2.5 w-14 rounded-full bg-primario ring-1 ring-inset ring-texto-principal/25 ${className}`}
    />
  );
}

export function TituloConAcento({
  etiqueta,
  children,
  detalle,
  como: Etiqueta = "h1",
}: {
  /** Linea corta encima del titulo. */
  etiqueta?: string;
  /** El titulo. Admite saltos de linea con <br />. */
  children: ReactNode;
  /** Texto explicativo debajo de la barra. */
  detalle?: ReactNode;
  /** Nivel del encabezado, segun donde viva la card. */
  como?: "h1" | "h2";
}) {
  return (
    <>
      {etiqueta ? <p className="etiqueta">{etiqueta}</p> : null}

      <Etiqueta className="font-display mt-2 text-[34px] uppercase leading-none text-texto-principal">
        {children}
      </Etiqueta>

      <BarraAcento className="mt-4" />

      {detalle ? (
        <p className="mt-4 text-[15px] text-texto-secundario">{detalle}</p>
      ) : null}
    </>
  );
}
