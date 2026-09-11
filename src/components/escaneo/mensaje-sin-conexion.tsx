import type { ReactNode } from "react";

import { MensajeFriccion } from "@/components/escaneo/mensaje-friccion";

/**
 * Sin señal al intentar validar o canjear (T058).
 *
 * No se guarda ni se reintenta nada en segundo plano: la spec (flujo
 * alternativo 4) pide decirlo y esperar a que la persona vuelva a intentar.
 */
export function MensajeSinConexion({ acciones }: { acciones: ReactNode }) {
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
          <path d="M3 3l18 18M5 12a10 10 0 0114 0M8.5 15.5a5 5 0 017 0M12 19h.01" />
        </svg>
      }
      titulo="Te quedaste sin señal"
      detalle="Intenta de nuevo cuando tengas conexion."
      acciones={acciones}
    />
  );
}
