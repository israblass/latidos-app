"use client";

import { useEffect, useState } from "react";

/** Por debajo de esta fraccion del alto de la ventana, el teclado esta abierto. */
export const UMBRAL_TECLADO = 0.75;

/**
 * true mientras el teclado en pantalla esta abierto: el visualViewport queda
 * por debajo del 75% del alto de la ventana. Sin visualViewport, false.
 */
export function useTecladoAbierto(): boolean {
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    const vista = window.visualViewport;
    if (!vista) return;
    const medir = () => setAbierto(vista.height < window.innerHeight * UMBRAL_TECLADO);
    medir();
    vista.addEventListener("resize", medir);
    return () => vista.removeEventListener("resize", medir);
  }, []);
  return abierto;
}
