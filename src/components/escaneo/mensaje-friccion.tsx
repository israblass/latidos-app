import type { ReactNode } from "react";

/**
 * Envoltorio comun de los mensajes que cierran un escaneo sin Beats.
 *
 * Ninguno usa rojo ni tono de error: no hay nada que la persona haya hecho mal
 * (constitution §3, microcopy).
 */
export function MensajeFriccion({
  icono,
  titulo,
  detalle,
  acciones,
}: {
  icono: ReactNode;
  titulo: string;
  detalle: string;
  acciones: ReactNode;
}) {
  return (
    <div className="tarjeta flex flex-col items-center px-5 py-8 text-center">
      {icono}

      <h2 className="font-display mt-4 text-[22px] uppercase leading-tight text-texto-principal">
        {titulo}
      </h2>
      <p className="mt-2 text-[15px] text-texto-secundario">{detalle}</p>

      <div className="mt-7 flex w-full flex-col gap-3">{acciones}</div>
    </div>
  );
}
