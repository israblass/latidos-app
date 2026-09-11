import type { ReactNode } from "react";

import { MensajeFriccion } from "@/components/escaneo/mensaje-friccion";

/**
 * QR ya escaneado hoy por esta persona (T044).
 *
 * El mensaje enmarca el hecho como algo ya logrado y no como una restriccion
 * (spec, flujo alternativo 1): ya sumo con esa marca, no es que le hayan
 * negado nada.
 */
export function MensajeYaEscaneado({
  marca,
  acciones,
}: {
  marca: string;
  acciones: ReactNode;
}) {
  return (
    <MensajeFriccion
      icono={
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      }
      titulo={`Ya sumaste con ${marca} hoy`}
      detalle="Vuelve manana y suma otra vez con esta marca."
      acciones={acciones}
    />
  );
}
