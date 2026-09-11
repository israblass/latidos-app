import type { ReactNode } from "react";

import { MensajeFriccion } from "@/components/escaneo/mensaje-friccion";
import { IconoEstado } from "@/components/escaneo/icono-estado";

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
      icono={<IconoEstado nombre="icono-codigo-inactivo" />}
      titulo="No pudimos leer el codigo"
      detalle="Asegurate de enfocar bien el codigo y vuelve a intentar."
      acciones={acciones}
    />
  );
}
