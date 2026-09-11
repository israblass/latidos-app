import type { ReactNode } from "react";

import { MensajeFriccion } from "@/components/escaneo/mensaje-friccion";

/**
 * Codigo que no se pudo leer, o que no es de Latidos (T056).
 *
 * Se usa cuando el escaner ya se detuvo y hace falta una pantalla completa. En
 * el visor, un codigo ilegible no apaga la camara: ahi el mismo mensaje sale
 * como aviso bajo el visor y basta con reencuadrar (spec, flujo alternativo 3).
 */
export function MensajeQRInvalido({ acciones }: { acciones: ReactNode }) {
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
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h7v7h-7z" strokeDasharray="3 3" />
        </svg>
      }
      titulo="No pudimos leer el codigo"
      detalle="Asegurate de enfocar bien el codigo y vuelve a intentar."
      acciones={acciones}
    />
  );
}
