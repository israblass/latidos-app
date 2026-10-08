"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";

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

/**
 * Trazo ECG de progreso (constitution §2, v2.10.4): 6 tramos de 57 unidades,
 * cada uno con linea, un latido y linea. El viewBox empieza en -6 para que el
 * punto amarillo quepa entero en el paso 0.
 */
export const ANCHO_TRAMO_ECG = 57;
const VIEWBOX_X = -6;
const VIEWBOX_ANCHO = 354;
const VIEWBOX = `${VIEWBOX_X} 0 ${VIEWBOX_ANCHO} 30`;
const TRAZO_ECG =
  "M0,18 " +
  Array.from({ length: TOTAL_PASOS_REGISTRO }, (_, i) => {
    const x = i * ANCHO_TRAMO_ECG;
    return `L${x + 18},18 L${x + 24},18 L${x + 28},6 L${x + 33},26 L${x + 37},12 L${x + 41},18 L${x + 57},18`;
  }).join(" ");

/** Fraccion del ancho del dibujo que ocupa la coordenada x del viewBox. */
const fraccion = (x: number) => (x - VIEWBOX_X) / VIEWBOX_ANCHO;

/*
 * Ultimo paso pintado. Vive en el modulo, asi que sobrevive a las
 * navegaciones internas entre pasos y el trazo puede animarse desde ahi
 * (hacia adelante o hacia atras). En una carga en frio arranca un paso antes.
 */
let ultimoPaso: number | null = null;

const useEfectoDeDisposicion = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * El trazo de progreso. Tres capas apiladas con el mismo viewBox: el trazo
 * fantasma, el trazo azul recortado hasta x = paso * 57 y el punto amarillo.
 *
 * Para WebKit no se anima el ancho de un rect ni un clip-path: el recorte es
 * un par de transform (la caja con overflow hidden se corre a la izquierda y
 * el trazo de adentro se corre lo mismo a la derecha) y el punto se mueve con
 * otro transform. Las tres transiciones son de transform, compuestas en GPU.
 */
function TrazoProgreso({ paso }: { paso: number }) {
  const [x, setX] = useState(() => (ultimoPaso ?? paso - 1) * ANCHO_TRAMO_ECG);
  const destino = paso * ANCHO_TRAMO_ECG;

  // Con movimiento reducido, el trazo aparece ya en su sitio (antes de pintar).
  useEfectoDeDisposicion(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setX(destino);
  }, [destino]);

  useEffect(() => {
    ultimoPaso = paso;
    // Dos cuadros: el primero pinta el punto de partida; el segundo arranca
    // la transicion hacia el destino.
    let segundo = 0;
    const primero = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => setX(destino));
    });
    return () => {
      cancelAnimationFrame(primero);
      cancelAnimationFrame(segundo);
    };
  }, [paso, destino]);

  const lleno = fraccion(x) * 100;
  const oculto = 100 - lleno;

  return (
    <div className="registro-ecg-lienzo">
      <svg aria-hidden="true" className="registro-ecg-capa registro-ecg-fantasma" viewBox={VIEWBOX}>
        <path d={TRAZO_ECG} />
      </svg>
      <div className="registro-ecg-recorte" style={{ transform: `translateX(${-oculto}%)` }}>
        <svg
          aria-hidden="true"
          className="registro-ecg-capa registro-ecg-lleno"
          viewBox={VIEWBOX}
          style={{ transform: `translateX(${oculto}%)` }}
        >
          <path d={TRAZO_ECG} />
        </svg>
      </div>
      <div
        className="registro-ecg-punto"
        data-ecg-punto=""
        style={{ transform: `translateX(${(x / VIEWBOX_ANCHO) * 100}%)` }}
      >
        <svg aria-hidden="true" className="registro-ecg-capa" viewBox={VIEWBOX}>
          <circle cx="0" cy="18" r="6" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Envoltorio comun de las 6 pantallas del registro (constitution §2,
 * v2.10.4): fondo crema con los circulos del pulso muy suaves, boton para
 * volver, "Paso N de 6", el trazo ECG de progreso (azul con punto amarillo),
 * titulo en Anton y subtitulo breve.
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
          className="registro-ecg"
          role="progressbar"
          aria-valuenow={paso}
          aria-valuemin={1}
          aria-valuemax={TOTAL_PASOS_REGISTRO}
          aria-label="Progreso del registro"
          data-paso={paso}
          data-progreso-x={paso * ANCHO_TRAMO_ECG}
        >
          <TrazoProgreso paso={paso} />
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
