"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

/**
 * Boton de deslizar (constitution §2, v2.9.0): el circulo con flecha se
 * arrastra hasta el final para activar la accion. Solo para la accion
 * principal de una pantalla y para acciones que no se pueden deshacer (lo
 * usara "Canjear Beats"); los botones secundarios son de toque.
 *
 * Nadie depende del gesto: un toque simple en el circulo o en la etiqueta, y
 * Enter o Espacio con el circulo enfocado, tambien activan.
 *
 * Mientras se arrastra, la etiqueta se desvanece y un tinte se llena detras
 * del circulo. Soltado pasado el 82% del recorrido, completa (vibra 18ms si se
 * puede), ejecuta la accion y regresa; antes, regresa con rebote y no hace
 * nada. El pintado va directo al DOM (sin estado de React) para que el
 * arrastre no dispare renders.
 */

const UMBRAL = 0.82;
/** Movimiento minimo, en px, para que un toque cuente como arrastre. */
const TOLERANCIA = 3;

const FLECHA = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

type Props = {
  label: string;
  /**
   * "vidrio-amarillo" y "vidrio-blanco" (v2.10.0): la pista es vidrio (la
   * receta central .vidrio, solo cambia el tinte). Se usan en la bienvenida.
   */
  variante?: "amarillo" | "navy" | "blanco" | "vidrio-amarillo" | "vidrio-blanco";
  /** Nombre accesible del circulo; por defecto, "<label>. Desliza o toca para activar." */
  ariaLabel?: string;
  className?: string;
} & ({ href: string; onActivate?: never } | { onActivate: () => void; href?: never });

// Nombres completos a proposito: Tailwind solo conserva las clases de
// globals.css que encuentra escritas tal cual en el codigo.
const CLASE_VARIANTE = {
  amarillo: "deslizar--amarillo",
  navy: "deslizar--navy",
  blanco: "deslizar--blanco",
  "vidrio-amarillo": "vidrio deslizar--vidrio deslizar--vidrio-amarillo",
  "vidrio-blanco": "vidrio deslizar--vidrio deslizar--vidrio-blanco",
} as const;

/** El circulo navy con flecha amarilla (la unica excepcion del amarillo como trazo). */
const CIRCULO_NAVY = new Set(["amarillo", "blanco", "vidrio-amarillo"]);

const reduceMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function BotonDeslizar({ label, variante = "amarillo", ariaLabel, className = "", href, onActivate }: Props) {
  const router = useRouter();
  const raiz = useRef<HTMLDivElement>(null);
  const circulo = useRef<HTMLButtonElement>(null);
  const relleno = useRef<HTMLDivElement>(null);
  const etiqueta = useRef<HTMLDivElement>(null);
  const estado = useRef({ x: 0, max: 0, inicio: 0, arrastrando: false, movio: false, ocupado: false, ignorarClic: false });
  const temporizadores = useRef<number[]>([]);

  useEffect(() => {
    if (href) router.prefetch(href);
  }, [href, router]);

  useEffect(() => {
    const lista = temporizadores.current;
    return () => lista.forEach((t) => window.clearTimeout(t));
  }, []);

  const medir = useCallback(() => {
    const el = raiz.current;
    if (!el) return;
    const estilo = getComputedStyle(el);
    const pad = parseFloat(estilo.getPropertyValue("--pad")) || 8;
    const lado = parseFloat(estilo.getPropertyValue("--circulo")) || 48;
    estado.current.max = Math.max(0, el.clientWidth - lado - pad * 2);
  }, []);

  const pintar = useCallback((valor: number) => {
    const e = estado.current;
    const el = raiz.current;
    if (!el) return;
    e.x = Math.max(0, Math.min(e.max, valor));
    const estilo = getComputedStyle(el);
    const pad = parseFloat(estilo.getPropertyValue("--pad")) || 8;
    const lado = parseFloat(estilo.getPropertyValue("--circulo")) || 48;
    if (circulo.current) circulo.current.style.transform = `translateX(${e.x}px)`;
    if (relleno.current) relleno.current.style.width = e.x > 0 ? `${e.x + lado + pad}px` : "0px";
    if (etiqueta.current && e.max > 0) {
      etiqueta.current.style.opacity = String(Math.max(0, 1 - (e.x / e.max) * 1.4));
    }
  }, []);

  const despues = (ms: number, fn: () => void) => {
    temporizadores.current.push(window.setTimeout(fn, ms));
  };

  const volver = useCallback(() => {
    const el = raiz.current;
    if (!el) return;
    el.classList.remove("listo");
    el.classList.add("vuelve");
    pintar(0);
    if (etiqueta.current) etiqueta.current.style.opacity = "1";
    despues(reduceMovimiento() ? 0 : 420, () => {
      el.classList.remove("vuelve");
      estado.current.ocupado = false;
    });
  }, [pintar]);

  const completar = useCallback(() => {
    const e = estado.current;
    const el = raiz.current;
    if (e.ocupado || !el) return;
    e.ocupado = true;
    medir();
    el.classList.remove("vuelve");
    el.classList.add("listo");
    pintar(e.max);
    try {
      navigator.vibrate?.(18);
    } catch {
      // Hay navegadores que lo exponen y lanzan si no hubo gesto: no importa.
    }
    if (href) router.push(href);
    else onActivate?.();
    despues(reduceMovimiento() ? 500 : 900, volver);
  }, [href, medir, onActivate, pintar, router, volver]);

  const alPresionar = (ev: PointerEvent<HTMLButtonElement>) => {
    const e = estado.current;
    e.ignorarClic = false;
    if (e.ocupado) return;
    medir();
    e.arrastrando = true;
    e.movio = false;
    e.inicio = ev.clientX - e.x;
    raiz.current?.classList.remove("vuelve");
    raiz.current?.classList.add("arrastrando");
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };

  const alMover = (ev: PointerEvent<HTMLButtonElement>) => {
    const e = estado.current;
    if (!e.arrastrando) return;
    const nuevo = ev.clientX - e.inicio;
    if (Math.abs(nuevo - e.x) > TOLERANCIA) e.movio = true;
    if (e.movio) pintar(nuevo);
  };

  const alSoltar = () => {
    const e = estado.current;
    if (!e.arrastrando) return;
    e.arrastrando = false;
    raiz.current?.classList.remove("arrastrando");
    // Un toque sin arrastre lo resuelve el clic (que tambien llega con Enter
    // y Espacio). Tras un arrastre, el clic que sigue se ignora.
    if (!e.movio) return;
    e.ignorarClic = true;
    if (e.x >= e.max * UMBRAL) completar();
    else {
      e.ocupado = true;
      volver();
    }
  };

  const alCancelar = () => {
    const e = estado.current;
    if (!e.arrastrando) return;
    e.arrastrando = false;
    e.ignorarClic = true;
    raiz.current?.classList.remove("arrastrando");
    e.ocupado = true;
    volver();
  };

  const alClicCirculo = (ev: MouseEvent<HTMLButtonElement>) => {
    ev.stopPropagation();
    if (estado.current.ignorarClic) {
      estado.current.ignorarClic = false;
      return;
    }
    completar();
  };

  return (
    // Tocar la etiqueta (o cualquier parte del control) tambien activa. No es
    // un boton aparte: para teclado y lectores esta el circulo.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={raiz}
      data-boton-deslizar=""
      onClick={completar}
      className={`deslizar ${CLASE_VARIANTE[variante]} ${className}`}
    >
      <div ref={relleno} className="deslizar__relleno" />
      <div ref={etiqueta} aria-hidden="true" className="deslizar__etiqueta">
        <span>{label}</span>
      </div>
      <button
        ref={circulo}
        type="button"
        aria-label={ariaLabel ?? `${label}. Desliza o toca para activar.`}
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alCancelar}
        onClick={alClicCirculo}
        className={`deslizar__circulo ${CIRCULO_NAVY.has(variante) ? "circulo-navy" : ""}`}
      >
        {FLECHA}
      </button>
    </div>
  );
}
