"use client";

import { Bloque, TituloSeccion } from "@/components/onboarding/bloque";
import { CarruselOnboarding } from "@/components/onboarding/carrusel-onboarding";
import {
  IconoBolso,
  IconoCaja,
  IconoCalendario,
  IconoEntrada,
  IconoLibro,
  IconoManos,
  IconoQR,
} from "@/components/onboarding/iconos";

/**
 * Pantalla 2: como se ganan Beats y en que se canjean.
 *
 * Dos secciones separadas, cada una con sus bloques: primero como entran los
 * Beats, despues para que sirven. Los valores son los por defecto de la
 * constitution §5; el admin puede cambiarlos desde backoffice, y por eso la
 * pantalla lo advierte en vez de prometer cifras fijas.
 */
const FORMAS_DE_GANAR = [
  {
    icono: <IconoQR />,
    titulo: "Escanea QR de marcas",
    detalle: "En los stands de las marcas patrocinantes.",
    destacado: "+5",
  },
  {
    icono: <IconoCaja />,
    titulo: "Dona insumos",
    detalle: "En cualquier centro de acopio del programa.",
    destacado: "+10",
  },
  {
    icono: <IconoManos />,
    titulo: "Haz voluntariado",
    detalle: "Suma trabajando en las jornadas.",
    destacado: "+15",
  },
  {
    icono: <IconoCalendario />,
    titulo: "Asiste a actividades",
    detalle: "Cada actividad del programa suma.",
  },
];

const CANJES = [
  {
    icono: <IconoEntrada />,
    titulo: "Entradas al concierto",
    detalle: "Zona general, media o frente de tarima.",
  },
  {
    icono: <IconoBolso />,
    titulo: "Merch de Latidos",
    detalle: "Bolsos, gorras y mas. Tambien puedes donarlo.",
  },
  {
    icono: <IconoLibro />,
    titulo: "Cursos universitarios",
    detalle: "Oratoria y otros, por convenio con la UCV.",
  },
];

export default function PantallaComoGanarBeats() {
  return (
    <CarruselOnboarding pantalla={2} textoAvance="Siguiente">
      <div className="rounded-card bg-superficie px-5 py-7 text-center">
        <p className="etiqueta">Tu moneda en Latidos</p>
        <h1 className="font-display mt-2 text-[34px] uppercase leading-none text-primario">
          Beats
        </h1>
        <p className="mt-3 text-[15px] text-texto-secundario">
          Los ganas participando y los cambias por recompensas.
        </p>
      </div>

      <TituloSeccion>Como los ganas</TituloSeccion>
      <ul className="flex flex-col gap-3">
        {FORMAS_DE_GANAR.map((forma) => (
          <Bloque key={forma.titulo} {...forma} />
        ))}
      </ul>
      <p className="mt-3 text-xs text-texto-terciario">
        Los Beats de cada accion pueden variar segun la actividad.
      </p>

      <TituloSeccion>En que los cambias</TituloSeccion>
      <ul className="flex flex-col gap-3">
        {CANJES.map((canje) => (
          <Bloque key={canje.titulo} {...canje} />
        ))}
      </ul>
    </CarruselOnboarding>
  );
}
