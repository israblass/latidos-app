"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export const TOTAL_PASOS_REGISTRO = 6;

interface Props {
  paso: number;
  titulo: string;
  children: ReactNode;
}

/**
 * Envoltorio comun de las 6 pantallas del registro: boton para volver,
 * indicador "Paso N de 6", barra de progreso y el titulo de la pregunta.
 */
export function ProgresoRegistro({ paso, titulo, children }: Props) {
  const router = useRouter();
  const porcentaje = (paso / TOTAL_PASOS_REGISTRO) * 100;

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-4">
      <header>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver al paso anterior"
            className="-ml-2 flex h-12 w-12 items-center justify-center rounded-control text-texto-secundario transition-opacity active:opacity-60"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.08]"
          role="progressbar"
          aria-valuenow={paso}
          aria-valuemin={1}
          aria-valuemax={TOTAL_PASOS_REGISTRO}
          aria-label="Progreso del registro"
        >
          <div
            className="h-full rounded-full bg-secundario transition-[width] duration-300"
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        <h1 className="titulo-pantalla mt-8">{titulo}</h1>
      </header>

      <div className="mt-6 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
