"use client";

import { ContadorAnimado } from "@/components/escaneo/contador-animado";
import { IconoEstado } from "@/components/escaneo/icono-estado";
import { BarraAcento } from "@/components/marca/titulo-con-acento";

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
    <div className="tarjeta-elevada animate-entrar-tarjeta flex flex-col items-center px-5 py-8 text-center">
      {/* El check entra pasado de tamaño y asienta: es el momento que la
          persona vino a ver, y aparecer sin mas lo deja en nada. */}
      <IconoEstado
        nombre="icono-exito-check"
        className="animate-aparecer-check"
      />

      <h2 className="font-display mt-4 text-[24px] uppercase leading-tight text-texto-principal">
        Sumaste {beatsOtorgados} Beats de {marca}
      </h2>

      <div className="tarjeta-plana mt-6 w-full px-5 py-7">
        <ContadorAnimado
          desde={balanceAnterior}
          hasta={balanceNuevo}
          className="font-display block text-[56px] leading-none text-texto-principal"
        />
        <BarraAcento className="mt-3" />
        <p className="etiqueta mt-3 text-texto-secundario">Beats</p>
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
