"use client";

import { Bloque, TituloSeccion } from "@/components/onboarding/bloque";
import { CarruselOnboarding } from "@/components/onboarding/carrusel-onboarding";
import { IconoAsset } from "@/components/onboarding/icono-asset";
import { IlustracionOnboarding } from "@/components/onboarding/ilustracion";
import { TituloConAcento } from "@/components/marca/titulo-con-acento";

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
    icono: <IconoAsset nombre="icono-escanear-qr" />,
    titulo: "Escanea QR de marcas",
    detalle: "En los stands de las marcas patrocinantes.",
    destacado: "+5",
  },
  {
    icono: <IconoAsset nombre="icono-donar" />,
    titulo: "Dona insumos",
    detalle: "En cualquier centro de acopio del programa.",
    destacado: "+10",
  },
  {
    icono: <IconoAsset nombre="icono-voluntariado" />,
    titulo: "Haz voluntariado",
    detalle: "Suma trabajando en las jornadas.",
    destacado: "+15",
  },
  {
    icono: <IconoAsset nombre="icono-actividad-curso" />,
    titulo: "Asiste a actividades",
    detalle: "Cada actividad del programa suma.",
  },
];

const CANJES = [
  {
    icono: <IconoAsset nombre="recompensa-entrada-concierto" carpeta="recompensas" />,
    titulo: "Entradas al concierto",
    detalle: "Zona general, media o frente de tarima.",
  },
  {
    icono: <IconoAsset nombre="recompensa-merch" carpeta="recompensas" />,
    titulo: "Merch de Latidos",
    detalle: "Bolsos, gorras y mas. Tambien puedes donarlo.",
  },
  {
    icono: <IconoAsset nombre="recompensa-curso" carpeta="recompensas" />,
    titulo: "Cursos universitarios",
    detalle: "Oratoria y otros, por convenio con la UCV.",
  },
];

export default function PantallaComoGanarBeats() {
  return (
    <CarruselOnboarding pantalla={2} textoAvance="Siguiente">
      {/* Card oscura: el mismo par oscuro + amarillo del contador de Inicio, para
          que "Beats" se lea siempre igual en toda la app. */}
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

      <TituloSeccion>Como los ganas</TituloSeccion>
      <ul className="flex flex-col gap-3">
        {FORMAS_DE_GANAR.map((forma) => (
          <Bloque key={forma.titulo} {...forma} />
        ))}
      </ul>
      <p className="mt-3 text-xs text-texto-secundario">
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
