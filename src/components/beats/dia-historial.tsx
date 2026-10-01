"use client";

import { IconoReloj } from "@/components/beats/dashboard-beats";
import { FilaMovimiento } from "@/components/beats/fila-movimiento";
import { Acordeon } from "@/components/ui/acordeon";
import { beatsConSigno, conteoMovimientos, tituloDia } from "@/lib/beats/formato";
import type { DiaHistorial as Dia } from "@/types/beats";

/**
 * Un dia del historial (T021; constitution §2, v2.8.0): una seccion del
 * acordeon compartido dentro de la tarjeta del historial.
 *
 * Cerrado ya dice lo esencial: "Hoy", "Ayer" o la fecha, cuantos movimientos
 * hubo y el total neto del dia. Cada dia se abre y se cierra por su cuenta; el
 * estado lo lleva el hook del historial (el dia mas reciente nace abierto).
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
  return (
    <Acordeon
      titulo={tituloDia(dia.dia_local)}
      subtitulo={`${conteoMovimientos(dia.movimientos.length)} · ${beatsConSigno(dia.total_neto)}`}
      icono={<IconoReloj />}
      abierto={abierto}
      alAlternar={alAlternar}
      nivel={3}
      idRegion={`dia-${dia.dia_local}`}
    >
      <ul className="divide-y divide-texto-principal/[0.08]">
        {dia.movimientos.map((movimiento) => (
          <FilaMovimiento key={movimiento.id} movimiento={movimiento} />
        ))}
      </ul>
    </Acordeon>
  );
}
