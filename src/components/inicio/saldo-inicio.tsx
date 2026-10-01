"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { ContadorBeatsVivo } from "@/components/beats/contador-beats-vivo";
import { useAlVolver } from "@/hooks/use-al-volver";
import { leerResumen } from "@/lib/beats/consultas";

/**
 * Contador de Inicio. Se ve igual que siempre (el mismo ContadorBeats con su
 * halo), pero al volver a la app relee el saldo en silencio: si cambio
 * mientras el telefono estaba bloqueado, el numero sube con la animacion
 * normal, sin recargar la pantalla.
 *
 * La card entera es el enlace a Beats: tocar el saldo para ver el detalle es
 * lo natural (spec de Beats §1). La etiqueta dice a donde lleva y conserva el
 * numero, que un lector de pantalla dejaria de leer si solo dijera "Ver mis
 * Beats".
 */
export function SaldoInicio({ saldoInicial }: { saldoInicial: number }) {
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
      className="vidrio-medio block w-full px-6 py-10 text-center outline-none focus-visible:ring-2 focus-visible:ring-secundario"
    >
      <ContadorBeatsVivo valor={saldo} />
    </Link>
  );
}
