import type { ReactNode } from "react";

import { MensajeFriccion } from "@/components/escaneo/mensaje-friccion";
import { IconoEstado } from "@/components/escaneo/icono-estado";

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
      icono={<IconoEstado nombre="icono-ya-escaneado" />}
      titulo={`Ya sumaste con ${marca} hoy`}
      detalle="Vuelve manana y suma otra vez con esta marca."
      acciones={acciones}
    />
  );
}
