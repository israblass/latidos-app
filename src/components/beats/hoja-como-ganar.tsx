"use client";

import { ListaComoGanar } from "@/components/beats/lista-como-ganar";
import { HojaInferior } from "@/components/ui/hoja-inferior";
import {
  EN_QUE_LOS_CAMBIAS,
  FORMAS_DE_GANAR,
  TITULO_COMO_GANAR,
  TITULO_EN_QUE_CAMBIAS,
} from "@/lib/beats/contenido-como-ganar";

/** La hoja "¿Cómo gano Beats?" con sus dos secciones (T030). */
export function HojaComoGanar({ abierta, alCerrar }: { abierta: boolean; alCerrar: () => void }) {
  return (
    <HojaInferior abierta={abierta} alCerrar={alCerrar} titulo="¿Cómo gano Beats?">
      <ListaComoGanar items={FORMAS_DE_GANAR} titulo={TITULO_COMO_GANAR} idTitulo="hoja-como-ganar" />
      <ListaComoGanar
        items={EN_QUE_LOS_CAMBIAS}
        titulo={TITULO_EN_QUE_CAMBIAS}
        idTitulo="hoja-en-que-cambias"
      />
    </HojaInferior>
  );
}
