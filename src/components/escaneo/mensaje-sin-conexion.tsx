import type { ReactNode } from "react";

import { MensajeFriccion } from "@/components/escaneo/mensaje-friccion";
import { IconoEstado } from "@/components/escaneo/icono-estado";

/**
 * Sin señal al intentar validar o canjear (T058).
 *
 * No se guarda ni se reintenta nada en segundo plano: la spec (flujo
 * alternativo 4) pide decirlo y esperar a que la persona vuelva a intentar.
 */
export function MensajeSinConexion({ acciones }: { acciones: ReactNode }) {
  return (
    <MensajeFriccion
      icono={<IconoEstado nombre="vacio-sin-conexion" carpeta="estados-vacios" />}
      titulo="Te quedaste sin señal"
      detalle="Intenta de nuevo cuando tengas conexion."
      acciones={acciones}
    />
  );
}
