"use client";

import { useEffect, useRef, useState } from "react";

/** Lo que dura el fundido de salida, en ms (igual que la transicion del CSS). */
const FUNDIDO = 250;
/** GIF transparente de 1x1, para el <img> fuera de la app instalada. */
const GIF_VACIO = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
/** Tope de seguridad: pase lo que pase, a los 8s el overlay ya no esta. */
const TOPE = 8000;

/**
 * Pantalla de carga de la app instalada (constitution §2, v2.10.1): el icono
 * centrado sobre el fondo de marca, igual que la imagen de arranque de iOS
 * (public/splash), para que el paso de una a otro no salte.
 *
 * Cubre el tramo entre que llega el HTML y la primera pintura de la app. Se
 * renderiza en el servidor como primer hijo del body y su CSS va en linea en
 * el <head> (CSS_SPLASH en layout.tsx): se ve sin esperar a la hoja de
 * estilos ni a JavaScript, y SOLO en modo instalado (display-mode:
 * standalone); en el navegador queda en display: none.
 *
 * Al hidratar y pintar (doble requestAnimationFrame) se desvanece en 250ms y
 * sale del DOM; con prefers-reduced-motion sale sin fundido. No hay esperas
 * artificiales. Si algo falla, el CSS lo oculta solo a los 8s y este
 * componente lo quita del DOM a la misma hora. Nunca recibe toques
 * (pointer-events: none) y, como vive en el layout raiz, no vuelve a aparecer
 * en las navegaciones internas.
 */
export function SplashInicial() {
  const [fase, setFase] = useState<"visible" | "saliendo" | "fuera">("visible");
  const capa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let segundo = 0;
    const primero = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => {
        const sinMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        // Fuera de la app instalada no se ve: se quita sin mas.
        const oculto = !capa.current || getComputedStyle(capa.current).display === "none";
        setFase(sinMovimiento || oculto ? "fuera" : "saliendo");
      });
    });
    const tope = window.setTimeout(() => setFase("fuera"), TOPE);
    return () => {
      cancelAnimationFrame(primero);
      cancelAnimationFrame(segundo);
      window.clearTimeout(tope);
    };
  }, []);

  useEffect(() => {
    if (fase !== "saliendo") return;
    const fin = window.setTimeout(() => setFase("fuera"), FUNDIDO);
    return () => window.clearTimeout(fin);
  }, [fase]);

  if (fase === "fuera") return null;

  return (
    <div
      ref={capa}
      id="splash-inicial"
      aria-hidden="true"
      data-fase={fase}
      className={fase === "saliendo" ? "saliendo" : undefined}
    >
      {/* El icono solo se descarga en la app instalada: en el navegador el
          <img> toma el GIF vacio en linea y no pide nada a la red. */}
      <picture>
        <source media="(display-mode: standalone)" srcSet="/icons/icon-512.png" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={GIF_VACIO} alt="" width={512} height={512} decoding="sync" {...{ fetchpriority: "high" }} />
      </picture>
    </div>
  );
}
