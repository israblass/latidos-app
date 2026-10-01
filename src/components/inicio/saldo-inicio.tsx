"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { ContadorBeatsVivo } from "@/components/beats/contador-beats-vivo";
import { useAlVolver } from "@/hooks/use-al-volver";
import { leerResumen } from "@/lib/beats/consultas";

/**
 * Tarjeta de Beats del Inicio (constitution §2, v2.7.0): vidrio claro (la
 * clase central .vidrio) sobre el degradado de marca, texto navy y etiqueta
 * gris, sin barra ni halo.
 *
 * Al volver a la app relee el saldo en silencio: si cambio mientras el
 * telefono estaba bloqueado, el numero sube con el conteo animado de siempre.
 *
 * La tarjeta entera es el enlace a Beats. La etiqueta dice a donde lleva y
 * conserva el numero, que un lector de pantalla dejaria de leer si solo dijera
 * "Ver mis Beats".
 */
export function SaldoInicio({
  saldoInicial,
  beatsSemana,
}: {
  saldoInicial: number;
  /** Suma de los ultimos 7 dias; null mientras no cargan los movimientos. */
  beatsSemana: number | null;
}) {
  const [saldo, setSaldo] = useState(saldoInicial);

  const refrescar = useCallback(async () => {
    try {
      const resumen = await leerResumen();
      if (resumen) setSaldo(resumen.saldo);
    } catch {
      // Sin red: se queda el numero que hay.
    }
  }, []);

  useAlVolver(() => void refrescar());

  return (
    <Link
      href="/beats"
      aria-label={`Ver mis Beats. Tienes ${saldo} Beats`}
      className="vidrio flex flex-col gap-[14px] rounded-[30px] px-6 py-[22px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secundario active:scale-[0.99] motion-reduce:active:scale-100"
    >
      {/* Alto fijo para la fila: el chip aparece cuando cargan los movimientos
          y no puede empujar el numero. */}
      <span className="flex min-h-[26px] items-center justify-between gap-3">
        <span className="text-[14px] text-texto-secundario">Beats acumulados</span>
        {beatsSemana !== null && beatsSemana > 0 ? (
          <span
            data-chip-semana=""
            className="shrink-0 rounded-full bg-primario px-3 py-[5px] text-[12px] font-bold text-texto-principal"
          >
            +{beatsSemana} esta semana
          </span>
        ) : null}
      </span>
      <ContadorBeatsVivo valor={saldo} variante="plano" />
    </Link>
  );
}
