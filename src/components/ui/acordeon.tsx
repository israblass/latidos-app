"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Seccion plegable (constitution §2, v2.6.0): cabecera con icono en circulo
 * azul al 12%, titulo, subtitulo y un circulo navy con chevron amarillo que gira
 * al abrir.
 *
 * Accesible como el patron de acordeon de WAI-ARIA: <h2><button> con
 * aria-expanded y aria-controls, y una region nombrada por el titulo. Cerrada,
 * la region queda `inert` y `aria-hidden` (ni foco ni arbol accesible). El alto se anima con
 * grid-template-rows 0fr -> 1fr en 250ms; con prefers-reduced-motion no hay
 * transicion.
 *
 * Va dentro de una tarjeta que la contiene (los acordeones del Inicio, el
 * historial de Beats); las secciones se separan con una linea fina.
 *
 * Por defecto guarda su propio estado. El historial de Beats (v2.8.0) lo
 * controla desde fuera (`abierto` + `alAlternar`), porque el hook del
 * historial decide que dia nace abierto y abre los dias que llegan en vivo.
 */
export function Acordeon({
  titulo,
  subtitulo,
  icono,
  abiertoAlInicio = false,
  abierto: abiertoControlado,
  alAlternar,
  nivel = 2,
  idRegion: idRegionPropio,
  children,
}: {
  titulo: string;
  subtitulo: string;
  /** SVG de 22px, decorativo. */
  icono: ReactNode;
  abiertoAlInicio?: boolean;
  /** Estado controlado desde fuera; con el, `alAlternar` hace el cambio. */
  abierto?: boolean;
  alAlternar?: () => void;
  /** Nivel del encabezado: 3 cuando la seccion ya tiene su h2 (Historial). */
  nivel?: 2 | 3;
  /** Id fijo para la region (las pruebas y los enlaces la buscan por dia). */
  idRegion?: string;
  children: ReactNode;
}) {
  const [abiertoPropio, setAbiertoPropio] = useState(abiertoAlInicio);
  const controlado = abiertoControlado !== undefined;
  const abierto = controlado ? abiertoControlado : abiertoPropio;
  const alternar = () => (controlado ? alAlternar?.() : setAbiertoPropio((a) => !a));
  const Encabezado = nivel === 3 ? "h3" : "h2";
  const id = useId();
  const idBoton = `${id}-boton`;
  const idTitulo = `${id}-titulo`;
  const idRegion = idRegionPropio ?? `${id}-region`;
  // `inert` todavia no es una prop tipada en React 18, pero React pasa el
  // atributo tal cual. Va en el render (y no en un efecto) para que llegue
  // tambien en el HTML del servidor, antes de hidratar.
  // aria-hidden ademas de inert: no todos los lectores ni herramientas
  // respetan todavia inert para sacar el contenido del arbol accesible.
  const inerte = (abierto ? {} : { inert: "", "aria-hidden": true }) as object;

  return (
    <section className="border-texto-principal/[0.08] [&+&]:border-t">
      <Encabezado>
        <button
          id={idBoton}
          type="button"
          aria-expanded={abierto}
          aria-controls={idRegion}
          onClick={alternar}
          className="flex w-full items-center gap-3 p-4 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-secundario"
        >
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secundario/[0.12] text-texto-principal"
          >
            {icono}
          </span>
          <span className="min-w-0 flex-1">
            <span id={idTitulo} className="block text-[16px] font-bold text-texto-principal">
              {titulo}
            </span>
            <span className="block text-[13px] text-texto-secundario">{subtitulo}</span>
          </span>
          <span
            aria-hidden="true"
            className="circulo-navy flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-[250ms] ease-out motion-reduce:transition-none ${
                abierto ? "rotate-180" : ""
              }`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
      </Encabezado>
      <div
        {...inerte}
        id={idRegion}
        role="region"
        aria-labelledby={idTitulo}
        data-acordeon-region=""
        className="grid transition-[grid-template-rows] duration-[250ms] ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: abierto ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
