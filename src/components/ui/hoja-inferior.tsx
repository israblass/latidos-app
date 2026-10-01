"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Hoja inferior (T028; constitution §2, "Bottom sheets"): radio de 24 px
 * arriba, fondo blanco, asa centrada y sombra superior.
 *
 * Se cierra al tocar fuera, al arrastrarla hacia abajo, con Escape y con el
 * boton "Cerrar". Mientras esta abierta el foco queda atrapado dentro, y al
 * cerrarse vuelve al elemento que la abrio: sin eso, quien navega con teclado
 * o lector de pantalla quedaria perdido al principio de la pagina.
 */

/** Cuanto hay que arrastrar hacia abajo, en px, para que se cierre. */
const UMBRAL_CIERRE = 80;

const SELECTOR_ENFOCABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function HojaInferior({
  abierta,
  alCerrar,
  titulo,
  variante = "vidrio",
  children,
}: {
  abierta: boolean;
  alCerrar: () => void;
  /** Nombre accesible de la hoja. */
  titulo: string;
  /**
   * "vidrio": la hoja de siempre (.vidrio-hoja, titulo en DM Sans y "Cerrar").
   * "aviso": blanca y opaca, titulo en Anton mayusculas y una X para cerrar
   * (notificaciones del Inicio, constitution §2, v2.7.0). Es opaca porque en
   * el Inicio ya hay dos vidrios grandes (la tarjeta de Beats y la barra) y
   * una tercera capa pasaria del limite. El comportamiento es el mismo.
   */
  variante?: "vidrio" | "aviso";
  children: ReactNode;
}) {
  const aviso = variante === "aviso";
  const idTitulo = useId();
  const hoja = useRef<HTMLDivElement>(null);
  const disparador = useRef<Element | null>(null);
  const inicioArrastre = useRef<number | null>(null);
  const [desplazamiento, setDesplazamiento] = useState(0);

  useEffect(() => {
    if (!abierta) return;

    disparador.current = document.activeElement;
    const nodo = hoja.current;
    nodo?.focus();

    // Lo de atras no se desplaza mientras la hoja esta encima.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        alCerrar();
        return;
      }
      if (evento.key !== "Tab" || !nodo) return;

      const enfocables = Array.from(nodo.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE));
      if (enfocables.length === 0) {
        evento.preventDefault();
        return;
      }
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const activo = document.activeElement;

      if (evento.shiftKey && (activo === primero || activo === nodo)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflowPrevio;
      setDesplazamiento(0);
      // El foco vuelve a quien abrio la hoja.
      if (disparador.current instanceof HTMLElement) disparador.current.focus();
    };
  }, [abierta, alCerrar]);

  if (!abierta) return null;

  const alEmpezarArrastre = (y: number) => {
    inicioArrastre.current = y;
  };
  const alArrastrar = (y: number) => {
    if (inicioArrastre.current === null) return;
    setDesplazamiento(Math.max(0, y - inicioArrastre.current));
  };
  const alSoltar = () => {
    if (inicioArrastre.current === null) return;
    inicioArrastre.current = null;
    if (desplazamiento > UMBRAL_CIERRE) alCerrar();
    else setDesplazamiento(0);
  };

  // En un portal sobre <body>: si la hoja quedara dentro de un contenedor con
  // su propio contexto de apilamiento (el <main> del Inicio es `isolate`), la
  // barra inferior se pintaria encima del velo y de la hoja.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Tocar fuera cierra. No es un boton: para teclado y lectores de
          pantalla estan Escape y "Cerrar". */}
      <div
        data-fondo-hoja
        aria-hidden="true"
        onClick={alCerrar}
        className="absolute inset-0 bg-texto-principal/30 motion-safe:animate-entrar-pantalla"
      />

      <div
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        style={{ transform: desplazamiento ? `translateY(${desplazamiento}px)` : undefined }}
        className={`relative flex max-h-[85dvh] w-full max-w-md flex-col outline-none motion-safe:animate-entrar-tarjeta ${
          aviso ? "rounded-t-[28px] bg-superficie shadow-[0_-10px_30px_rgba(26,35,50,0.16)]" : "vidrio-hoja"
        }`}
      >
        {/* Zona de arrastre: el asa y la cabecera. El contenido de abajo
            conserva su propio desplazamiento. */}
        <div
          className="touch-none px-5 pt-3"
          onPointerDown={(e) => {
            // El boton "Cerrar" vive en esta zona: tocarlo no es arrastrar.
            if ((e.target as HTMLElement).closest("button")) return;
            // Con la captura, el dedo puede salirse de la zona mientras
            // arrastra sin que se pierda el gesto.
            e.currentTarget.setPointerCapture(e.pointerId);
            alEmpezarArrastre(e.clientY);
          }}
          onPointerMove={(e) => alArrastrar(e.clientY)}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
        >
          <span aria-hidden="true" className="mx-auto block h-1.5 w-10 rounded-full bg-black/15" />
          <div className={`flex items-center justify-between gap-3 ${aviso ? "mt-1.5" : ""}`}>
            <h2
              id={idTitulo}
              className={
                aviso
                  ? "font-display text-[24px] uppercase leading-tight tracking-[0.02em] text-texto-principal"
                  : "text-[18px] font-medium text-texto-principal"
              }
            >
              {titulo}
            </h2>
            {aviso ? (
              // Circulo de 40px como la referencia, dentro de un area tactil
              // de 48px.
              <button
                type="button"
                onClick={alCerrar}
                aria-label="Cerrar"
                className="-mr-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-secundario"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-fondo-alterno text-texto-principal">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </span>
              </button>
            ) : (
              <button type="button" onClick={alCerrar} className="boton-ghost -mr-3">
                Cerrar
              </button>
            )}
          </div>
        </div>

        {/* Enfocable para que el teclado tambien pueda desplazar el contenido. */}
        <div
          tabIndex={0}
          className="overflow-y-auto px-5 pb-[calc(24px+env(safe-area-inset-bottom))] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secundario"
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
