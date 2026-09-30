"use client";

import { momentoDeLaCopia } from "@/lib/beats/formato";

/**
 * Aviso de estado de la pantalla de Beats (T041): el toast de la constitution
 * §2, blanco con sombra y borde izquierdo de color semantico.
 *
 * - Sin conexion, mostrando lo guardado: "Sin conexión. Así estaban tus Beats
 *   a las [hora]", con el dia si no fue hoy. Desaparece solo cuando vuelve la
 *   señal y la pantalla se recarga (spec §8.2).
 * - Con conexion pero con la carga fallida: "No pudimos actualizar" con
 *   "Reintentar" (spec §8.4).
 */
export function AvisoEstado(
  props:
    | { tipo: "sin-conexion"; actualizadoEn: string | null }
    | { tipo: "error"; alReintentar: () => void; reintentando?: boolean },
) {
  const borde = props.tipo === "sin-conexion" ? "border-alerta" : "border-error";

  return (
    <div
      role="status"
      data-aviso-beats={props.tipo}
      className={`tarjeta mb-4 flex items-center gap-3 rounded-control border-l-[3px] ${borde} py-3 pl-4 pr-2`}
    >
      {props.tipo === "sin-conexion" ? (
        <p className="flex-1 text-[15px] text-texto-principal">
          Sin conexión.{" "}
          {props.actualizadoEn
            ? `Así estaban tus Beats ${momentoDeLaCopia(props.actualizadoEn)}.`
            : "Esto es lo último que tenías guardado."}
        </p>
      ) : (
        <>
          <p className="flex-1 text-[15px] text-texto-principal">No pudimos actualizar.</p>
          <button
            type="button"
            onClick={props.alReintentar}
            disabled={props.reintentando}
            className="boton-ghost shrink-0"
          >
            {props.reintentando ? <span className="girador" aria-hidden="true" /> : null}
            <span className={props.reintentando ? "ml-2" : ""}>Reintentar</span>
          </button>
        </>
      )}
    </div>
  );
}
