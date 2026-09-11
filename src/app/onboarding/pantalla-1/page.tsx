"use client";

import { CarruselOnboarding } from "@/components/onboarding/carrusel-onboarding";
import { ImagenMarca } from "@/components/marca/imagen-marca";
import { ASSETS } from "@/lib/assets";
import { IlustracionOnboarding } from "@/components/onboarding/ilustracion";

/**
 * Pantalla 1: que es Latidos.
 *
 * Segmentada en bloques y no en un parrafo corrido: el programa son tres fases
 * con fechas distintas, y cada una se entiende mejor por separado
 * (constitution §1, contexto del programa).
 *
 * Los acentos de cada fase son bordes de 4px: el amarillo puro desaparece a ese
 * grosor sobre blanco, asi que Empuje usa el ambar de alerta, que si se ve.
 *
 * Cada fase se identifica con su lettering oficial en vez de con el nombre
 * escrito. El nombre viaja en el `alt`, asi que sigue estando para lectores de
 * pantalla y reaparece como texto si la imagen no carga.
 */
const FASES = [
  {
    nombre: "Pulso",
    lettering: ASSETS.letteringPulso,
    fechas: "15 sept — 30 marzo",
    detalle: "Dona insumos en centros de acopio y suma por cada jornada.",
    acento: "border-l-secundario",
  },
  {
    nombre: "Empuje",
    lettering: ASSETS.letteringEmpuje,
    fechas: "18 diciembre",
    detalle: "Gaitazo y misa de accion de gracias, con marcas invitadas.",
    acento: "border-l-alerta",
  },
  {
    nombre: "Late Venezuela",
    lettering: ASSETS.letteringLateVenezuela,
    fechas: "23 — 27 marzo",
    detalle: "Expos, torneos y concierto de cierre en la UCV.",
    acento: "border-l-exito",
  },
];

export default function PantallaQueEsLatidos() {
  return (
    <CarruselOnboarding pantalla={1} textoAvance="Siguiente">
      {/* Acento amarillo y no bloque amarillo: el boton de avanzar es el unico
          amarillo grande de la pantalla. */}
      <IlustracionOnboarding
        nombre="onboarding-1-comunidad"
        descripcion="Tres personas de la comunidad UCV llevando cajas de donaciones"
      />

      <div className="vidrio-medio mt-2 px-5 py-7 text-center">
        <p className="etiqueta">Programa UCV</p>
        <h1 className="font-display mt-2 text-[34px] uppercase leading-none text-texto-principal">
          Seis meses
          <br />
          de Latidos
        </h1>
        <div
          aria-hidden="true"
          className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-primario"
        />
        <p className="mt-4 text-[15px] text-texto-secundario">
          Un programa en tres fases, de septiembre a marzo.
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {FASES.map((fase) => (
          <li
            key={fase.nombre}
            className={`vidrio-medio overflow-hidden border-l-4 p-4 ${fase.acento}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex min-w-0 items-center">
                <ImagenMarca
                  src={fase.lettering}
                  alt={fase.nombre}
                  alto={30}
                  className="max-w-[60%]"
                />
              </h3>
              <span className="shrink-0 text-xs text-texto-secundario">
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
