"use client";

import { ListaComoGanar } from "@/components/beats/lista-como-ganar";
import { CarruselOnboarding } from "@/components/onboarding/carrusel-onboarding";
import { IlustracionOnboarding } from "@/components/onboarding/ilustracion";
import { TituloConAcento } from "@/components/marca/titulo-con-acento";
import {
  EN_QUE_LOS_CAMBIAS,
  FORMAS_DE_GANAR,
  TITULO_COMO_GANAR,
  TITULO_EN_QUE_CAMBIAS,
} from "@/lib/beats/contenido-como-ganar";

/**
 * Pantalla 2: como se ganan Beats y en que se canjean.
 *
 * El contenido sale de src/lib/beats/contenido-como-ganar.ts, el mismo que usa
 * la hoja "¿Cómo gano Beats?" de la pantalla de Beats (spec de Beats §9 regla
 * 10). Antes esta pantalla tenia su propia lista con montos fijos ("+5" por
 * escanear) que no coincidian con lo que da cada marca; ahora dice "Cada marca
 * da distinto" y marca "Pronto" lo que todavia no existe (spec de registro,
 * ajuste del 2026-09-29).
 *
 * La estructura visual es la de siempre: ilustracion, card de titulo y dos
 * secciones de bloques.
 */
export default function PantallaComoGanarBeats() {
  return (
    <CarruselOnboarding pantalla={2} textoAvance="Siguiente">
      <IlustracionOnboarding
        nombre="onboarding-2-escanear"
        descripcion="Una persona escaneando el codigo QR de una marca con su telefono"
      />

      <div className="vidrio-medio mt-3 px-5 py-7 text-center">
        <TituloConAcento
          etiqueta="Tu moneda en Latidos"
          detalle="Los ganas participando y los cambias por recompensas."
        >
          Beats
        </TituloConAcento>
      </div>

      <ListaComoGanar
        items={FORMAS_DE_GANAR}
        titulo={TITULO_COMO_GANAR}
        idTitulo="onboarding-como-ganar"
        nivel={2}
      />
      <ListaComoGanar
        items={EN_QUE_LOS_CAMBIAS}
        titulo={TITULO_EN_QUE_CAMBIAS}
        idTitulo="onboarding-en-que-cambias"
        nivel={2}
      />
    </CarruselOnboarding>
  );
}
