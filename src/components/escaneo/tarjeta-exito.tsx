"use client";

import { ContadorAnimado } from "@/components/escaneo/contador-animado";

/**
 * Cierre de un canje confirmado (T053, T054).
 *
 * El contador sube con animacion desde el balance anterior hasta el nuevo. El
 * cierre cambia segun el modo evento (spec §9 regla 12): encendido invita a
 * seguir escaneando, porque hay mas stands cerca; apagado no agrega ningun CTA
 * mas alla de volver a Inicio (spec §10 suposicion 12).
 */
export function TarjetaExito({
  marca,
  beatsOtorgados,
  balanceAnterior,
  balanceNuevo,
  modoEventoActivo,
  onSeguirEscaneando,
  onVolverAInicio,
}: {
  marca: string;
  beatsOtorgados: number;
  balanceAnterior: number;
  balanceNuevo: number;
  modoEventoActivo: boolean;
  onSeguirEscaneando: () => void;
  onVolverAInicio: () => void;
}) {
  return (
    <div className="tarjeta flex flex-col items-center px-5 py-8 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-fondo-alterno text-exito-texto"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>

      <h2 className="font-display mt-5 text-[24px] uppercase leading-tight text-texto-principal">
        Sumaste {beatsOtorgados} Beats de {marca}
      </h2>

      <div className="bloque-oscuro mt-6 w-full px-5 py-7 shadow-elevado">
        <ContadorAnimado
          desde={balanceAnterior}
          hasta={balanceNuevo}
          className="font-display block text-[56px] leading-none text-primario"
        />
        <p className="etiqueta mt-1 text-white/70">Beats</p>
      </div>

      {modoEventoActivo ? (
        <p className="mt-5 text-[15px] text-texto-secundario">
          Sigue escaneando, hay mas marcas cerca.
        </p>
      ) : null}

      <div className="mt-7 flex w-full flex-col gap-3">
        {modoEventoActivo ? (
          <button
            type="button"
            onClick={onSeguirEscaneando}
            className="boton-primario"
          >
            Seguir escaneando
          </button>
        ) : null}

        <button
          type="button"
          onClick={onVolverAInicio}
          className={modoEventoActivo ? "boton-secundario" : "boton-primario"}
        >
          Volver a Inicio
        </button>
      </div>
    </div>
  );
}
