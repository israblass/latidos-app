import type { ReactNode } from "react";

import { MensajeFriccion } from "@/components/escaneo/mensaje-friccion";
import { IconoEstado } from "@/components/escaneo/icono-estado";

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
      icono={<IconoEstado nombre="icono-codigo-inactivo" />}
      titulo="Este codigo ya no esta activo"
      detalle="Busca otro QR de marca para seguir sumando."
      acciones={acciones}
    />
  );
}
