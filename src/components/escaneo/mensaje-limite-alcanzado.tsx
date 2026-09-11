import type { ReactNode } from "react";

import { MensajeFriccion } from "@/components/escaneo/mensaje-friccion";

/**
 * QR que llego a su limite total de usos (T045).
 *
 * El copy es neutro a proposito: no menciona limites, ni que se acabo, ni que
 * llego tarde (spec, flujo alternativo 2). La persona suele estar parada
 * frente al stand de la marca, y no tiene por que sentir que se perdio algo.
 */
export function MensajeLimiteAlcanzado({ acciones }: { acciones: ReactNode }) {
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
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      }
      titulo="Este codigo ya no esta activo"
      detalle="Busca otro QR de marca para seguir sumando."
      acciones={acciones}
    />
  );
}
