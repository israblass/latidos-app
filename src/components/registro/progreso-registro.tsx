"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { ILUSTRACIONES } from "@/lib/ilustraciones";

export const TOTAL_PASOS_REGISTRO = 6;

interface Props {
  paso: number;
  titulo: string;
  /** Una linea breve debajo del titulo. */
  subtitulo?: string;
  /** El corazon decorativo junto al titulo: solo en el paso 1. */
  corazon?: boolean;
  children: ReactNode;
}

/** Un tramo del trazo ECG: linea, un latido y linea, en 60 unidades de ancho. */
const tramo = (i: number) => {
  const x = i * 60;
  return `M${x + 2} 16 H${x + 18} L${x + 24} 6 L${x + 30} 26 L${x + 36} 12 L${x + 40} 16 H${x + 58}`;
};

/**
 * Envoltorio comun de las 6 pantallas del registro (constitution §2,
 * v2.10.2): fondo crema con los circulos del pulso muy suaves, boton para
 * volver, "Paso N de 6" con el trazo ECG de progreso (6 tramos, el activo
 * resaltado), titulo en Anton y subtitulo breve.
 */
export function ProgresoRegistro({ paso, titulo, subtitulo, corazon = false, children }: Props) {
  const router = useRouter();
  const arte = ILUSTRACIONES.circulosPulsoBienvenida;
  const latido = ILUSTRACIONES.corazonLatidoBienvenida;

  return (
    <div className="registro">
      <div aria-hidden="true" className="registro-arte">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={arte.src} alt="" width={arte.ancho} height={arte.alto} decoding="async" />
      </div>

      <header>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver al paso anterior"
            className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-texto-principal transition-opacity active:opacity-60"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="etiqueta">
            Paso {paso} de {TOTAL_PASOS_REGISTRO}
          </span>
        </div>

        <div
          className="mt-2"
          role="progressbar"
          aria-valuenow={paso}
          aria-valuemin={1}
          aria-valuemax={TOTAL_PASOS_REGISTRO}
          aria-label="Progreso del registro"
        >
          <svg
            aria-hidden="true"
            className="registro-ecg"
            viewBox={`0 0 ${TOTAL_PASOS_REGISTRO * 60} 32`}
            preserveAspectRatio="none"
          >
            {Array.from({ length: TOTAL_PASOS_REGISTRO }, (_, i) => (
              <path
                key={i}
                d={tramo(i)}
                vectorEffect="non-scaling-stroke"
                data-estado={i + 1 < paso ? "hecho" : i + 1 === paso ? "activo" : "pendiente"}
              />
            ))}
          </svg>
        </div>

        <div className="mt-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="registro-titulo">{titulo}</h1>
            {subtitulo ? <p className="registro-subtitulo">{subtitulo}</p> : null}
          </div>
          {corazon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={latido.src}
              alt=""
              aria-hidden="true"
              width={latido.ancho}
              height={latido.alto}
              decoding="async"
              data-corazon-registro=""
              className="-mt-2 h-auto w-[72px] shrink-0"
            />
          ) : null}
        </div>
      </header>

      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
