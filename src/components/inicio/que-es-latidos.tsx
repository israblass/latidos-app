import Image from "next/image";

import { ILUSTRACIONES, type Ilustracion } from "@/lib/ilustraciones";

/**
 * "Qué es Latidos" en Inicio: un parrafo sobre el programa y sus tres fases.
 *
 * Las fases van en tarjetas con scroll horizontal y no en acordeon: son tres,
 * cortas y del mismo peso, y la siguiente asoma por el borde, que es la pista
 * de que hay mas. Un acordeon escondería las fechas detras de un toque.
 *
 * Los datos coinciden con la pantalla 1 del onboarding (mismas fases y
 * fechas); aqui cada fase lleva ademas su estado.
 */

type Fase = {
  nombre: string;
  fechas: string;
  /** Lo que se lee en voz alta en lugar de las fechas abreviadas. */
  fechasCompletas: string;
  estado: "En curso" | "Próximamente";
  detalle: string;
  ilustracion: Ilustracion;
  /** Que se ve en la ilustracion. */
  descripcion: string;
};

export const FASES: Fase[] = [
  {
    nombre: "Pulso",
    fechas: "15 sept - 30 mar",
    fechasCompletas: "Del 15 de septiembre al 30 de marzo",
    estado: "En curso",
    detalle:
      "Responsabilidad social. Cada mes una jornada con los insumos que se necesitan para las comunidades afectadas por el terremoto de La Guaira. Dona en un centro de acopio y suma Beats.",
    ilustracion: ILUSTRACIONES.donacionesCajasBandera,
    descripcion: "Cajas de donaciones con insumos y la bandera de Venezuela",
  },
  {
    nombre: "Empuje",
    fechas: "18 dic 2026",
    fechasCompletas: "18 de diciembre de 2026",
    estado: "Próximamente",
    detalle:
      "Gaitazo y Misa de Acción de Gracias. Un encuentro de fe, tradición y unión para celebrar la resiliencia de la comunidad, con marcas invitadas, stands y QR para sumar Beats.",
    ilustracion: ILUSTRACIONES.corazonGorroNavidad,
    descripcion: "Un corazón amarillo con gorro navideño",
  },
  {
    nombre: "Late Venezuela",
    fechas: "23 al 27 mar 2027",
    fechasCompletas: "Del 23 al 27 de marzo de 2027",
    estado: "Próximamente",
    detalle:
      "Cinco días en la UCV: expo de marcas, expo automotriz, feria gastronómica, torneos deportivos y concierto de cierre el 27 de marzo.",
    ilustracion: ILUSTRACIONES.estadioBeisbol,
    descripcion: "El estadio de béisbol de la UCV visto desde arriba",
  },
];

function ChipEstado({ estado }: { estado: Fase["estado"] }) {
  const enCurso = estado === "En curso";
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-etiqueta ${
        enCurso
          ? "border-secundario/40 bg-superficie text-secundario-texto"
          : "border-sutil bg-fondo-alterno text-texto-secundario"
      }`}
    >
      {estado}
    </span>
  );
}

export function QueEsLatidos() {
  return (
    <section aria-labelledby="que-es-latidos" className="w-full">
      <h2
        id="que-es-latidos"
        className="font-display text-[26px] uppercase leading-none text-texto-principal"
      >
        Qué es Latidos
      </h2>
      <p className="mt-3 text-[15px] text-texto-secundario">
        Latidos es el programa de la UCV que une a estudiantes, marcas y comunidad durante seis
        meses, de septiembre de 2026 a marzo de 2027. Participas, sumas Beats y los cambias por
        cosas que te importan.
      </p>

      {/*
        El contenedor se puede enfocar para que el teclado tambien desplace la
        fila. Se sale del margen de la pantalla para que las tarjetas lleguen
        al borde y la siguiente asome.
      */}
      <ul
        aria-label="Fases del programa"
        tabIndex={0}
        className="-mx-5 mt-4 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secundario"
      >
        {FASES.map((fase) => (
          <li
            key={fase.nombre}
            className="superficie flex w-[78%] max-w-[300px] shrink-0 snap-start flex-col p-4"
          >
            {/* Por debajo del pliegue: carga diferida (la de next/image por
                defecto). El alto fijo reserva el espacio antes de que llegue. */}
            <div className="mb-3 flex h-24 items-center justify-center">
              <Image
                src={fase.ilustracion.src}
                alt={fase.descripcion}
                width={Math.round((96 * fase.ilustracion.ancho) / fase.ilustracion.alto)}
                height={96}
                loading="lazy"
                className="h-24 w-auto"
              />
            </div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-[22px] uppercase leading-none text-texto-principal">
                {fase.nombre}
              </h3>
              <ChipEstado estado={fase.estado} />
            </div>
            <p className="mt-2 text-[13px] font-medium text-texto-principal">
              <span aria-hidden="true">{fase.fechas}</span>
              <span className="sr-only">{fase.fechasCompletas}</span>
            </p>
            <p className="mt-2 text-[14px] text-texto-secundario">{fase.detalle}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
