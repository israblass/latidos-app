"use client";

import { CarruselOnboarding } from "@/components/onboarding/carrusel-onboarding";

/**
 * Pantalla 1: que es Latidos.
 *
 * Segmentada en bloques y no en un parrafo corrido: el programa son tres fases
 * con fechas distintas, y cada una se entiende mejor por separado
 * (constitution §1, contexto del programa).
 */
const FASES = [
  {
    nombre: "Pulso",
    fechas: "15 sept — 30 marzo",
    detalle: "Dona insumos en centros de acopio y suma por cada jornada.",
    acento: "border-l-secundario",
  },
  {
    nombre: "Empuje",
    fechas: "18 diciembre",
    detalle: "Gaitazo y misa de accion de gracias, con marcas invitadas.",
    acento: "border-l-primario",
  },
  {
    nombre: "Late Venezuela",
    fechas: "23 — 27 marzo",
    detalle: "Expos, torneos y concierto de cierre en la UCV.",
    acento: "border-l-exito",
  },
];

export default function PantallaQueEsLatidos() {
  return (
    <CarruselOnboarding pantalla={1} textoAvance="Siguiente">
      <div className="rounded-card bg-superficie px-5 py-7 text-center">
        <p className="etiqueta">Programa UCV</p>
        <h1 className="font-display mt-2 text-[34px] uppercase leading-none text-primario">
          Seis meses
          <br />
          de Latidos
        </h1>
        <p className="mt-3 text-[15px] text-texto-secundario">
          Un programa en tres fases, de septiembre a marzo.
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {FASES.map((fase) => (
          <li
            key={fase.nombre}
            className={`rounded-card border border-sutil border-l-4 bg-superficie p-4 ${fase.acento}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[18px] uppercase text-texto-principal">
                {fase.nombre}
              </h3>
              <span className="shrink-0 text-xs text-texto-terciario">
                {fase.fechas}
              </span>
            </div>
            <p className="mt-1 text-[14px] text-texto-secundario">
              {fase.detalle}
            </p>
          </li>
        ))}
      </ul>
    </CarruselOnboarding>
  );
}
