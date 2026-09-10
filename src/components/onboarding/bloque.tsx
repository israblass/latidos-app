import type { ReactNode } from "react";

/**
 * Bloque de una seccion del onboarding: icono, titulo, detalle y un valor
 * destacado opcional (los Beats de una accion, por ejemplo).
 */
export function Bloque({
  icono,
  titulo,
  detalle,
  destacado,
}: {
  icono: ReactNode;
  titulo: string;
  detalle: string;
  destacado?: string;
}) {
  return (
    <li className="tarjeta flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-elevado text-secundario"
      >
        {icono}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-texto-principal">
          {titulo}
        </span>
        <span className="block text-xs text-texto-secundario">{detalle}</span>
      </span>

      {destacado ? (
        <span className="shrink-0 rounded-full bg-primario px-2.5 py-1 text-[13px] font-bold text-fondo">
          {destacado}
        </span>
      ) : null}
    </li>
  );
}

/** Titulo de una seccion dentro de una pantalla del onboarding. */
export function TituloSeccion({ children }: { children: ReactNode }) {
  return <h2 className="etiqueta mb-3 mt-7">{children}</h2>;
}
