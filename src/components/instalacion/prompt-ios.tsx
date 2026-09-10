"use client";

import { useEffect, useRef } from "react";

interface Props {
  onCerrar: () => void;
}

/**
 * Modal de instalacion para iOS.
 *
 * Safari no expone ninguna API para disparar la instalacion, asi que lo unico
 * que se puede hacer es explicar los pasos (spec §10 suposicion 2). Nunca
 * bloquea: se cierra con la X, con "Entendido", tocando fuera o con Escape, y
 * detras la bienvenida sigue viva.
 */
export function PromptIOS({ onCerrar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPresionar);
    contenedor.current?.focus();
    return () => document.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Tocar fuera cierra. Es decorativo: los lectores de pantalla llegan al
          boton de cerrar, que hace lo mismo. */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <div
        ref={contenedor}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-instalacion-ios"
        tabIndex={-1}
        className="relative w-full max-w-md rounded-t-sheet border-t border-sutil bg-superficie px-5 pb-8 pt-5 outline-none"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-elevado" />

        <div className="flex items-start justify-between gap-4">
          <h2 id="titulo-instalacion-ios" className="font-display text-[22px] uppercase">
            Para instalar Latidos
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-2 -mt-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-control text-texto-secundario transition-opacity active:opacity-60"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-texto-secundario">
          Usa Latidos como una app en tu telefono.
        </p>

        <ol className="mt-5 flex flex-col gap-4">
          {[
            <>
              Toca <span className="text-texto-principal">Compartir</span> en la
              barra del navegador
            </>,
            <>
              Elige{" "}
              <span className="text-texto-principal">
                Agregar a pantalla de inicio
              </span>
            </>,
            <>
              Toca <span className="text-texto-principal">Agregar</span>
            </>,
          ].map((paso, indice) => (
            <li key={indice} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primario text-[13px] font-bold text-fondo">
                {indice + 1}
              </span>
              <span className="text-[15px] text-texto-secundario">{paso}</span>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onCerrar} className="boton-primario mt-7">
          Entendido
        </button>
      </div>
    </div>
  );
}
