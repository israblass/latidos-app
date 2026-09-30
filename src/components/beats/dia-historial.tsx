"use client";

import { FilaMovimiento } from "@/components/beats/fila-movimiento";
import { beatsConSigno, conteoEscaneos, etiquetaDia } from "@/lib/beats/formato";
import type { DiaHistorial as Dia } from "@/types/beats";

/**
 * Un dia del historial como acordeon (T021).
 *
 * Cerrado ya dice lo esencial: el dia, el total neto y cuantos escaneos hubo.
 * Un dia sin escaneos (solo la bienvenida, un regalo) muestra el total sin
 * conteo (spec §10.3). Cada dia se abre y se cierra por su cuenta.
 */
export function DiaHistorial({
  dia,
  abierto,
  alAlternar,
}: {
  dia: Dia;
  abierto: boolean;
  alAlternar: () => void;
}) {
  const idPanel = `dia-${dia.dia_local}`;
  const resumen =
    dia.escaneos > 0
      ? `${beatsConSigno(dia.total_neto)} · ${conteoEscaneos(dia.escaneos)}`
      : beatsConSigno(dia.total_neto);

  return (
    <li className="border-b border-sutil last:border-b-0">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={alAlternar}
        className="flex min-h-touch w-full items-center gap-3 py-3 text-left"
      >
        <span className="flex-1 text-[13px] font-medium uppercase tracking-etiqueta text-texto-principal">
          {etiquetaDia(dia.dia_local)}
        </span>
        <span className="text-[13px] text-texto-secundario">{resumen}</span>
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-texto-secundario transition-transform duration-200 motion-reduce:transition-none ${
            abierto ? "rotate-180" : ""
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <ul id={idPanel} hidden={!abierto} className="pb-2 pl-1">
        {dia.movimientos.map((movimiento) => (
          <FilaMovimiento key={movimiento.id} movimiento={movimiento} />
        ))}
      </ul>
    </li>
  );
}
