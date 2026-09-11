"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Numero que sube hasta su valor final.
 *
 * Es la firma visual de la app: el contador de Beats con animacion de
 * incremento cuando se suman puntos (constitution §2).
 *
 * Respeta `prefers-reduced-motion`: quien pidio menos movimiento ve el numero
 * final de una vez.
 */
export function ContadorAnimado({
  desde,
  hasta,
  duracionMs = 900,
  className = "",
}: {
  desde: number;
  hasta: number;
  duracionMs?: number;
  className?: string;
}) {
  const [valor, setValor] = useState(desde);
  const cuadro = useRef<number>();

  useEffect(() => {
    const sinMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (sinMovimiento || desde === hasta) {
      setValor(hasta);
      return;
    }

    const inicio = performance.now();

    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / duracionMs);
      // Desaceleracion al final: arranca rapido y se asienta en el numero.
      const suavizado = 1 - Math.pow(1 - avance, 3);
      setValor(Math.round(desde + (hasta - desde) * suavizado));

      if (avance < 1) cuadro.current = requestAnimationFrame(paso);
    };

    cuadro.current = requestAnimationFrame(paso);
    return () => {
      if (cuadro.current) cancelAnimationFrame(cuadro.current);
    };
  }, [desde, hasta, duracionMs]);

  // El valor final va en aria-label para que un lector de pantalla no lea cada
  // numero intermedio.
  return (
    <span className={className} aria-label={`${hasta} Beats`}>
      <span aria-hidden="true">{valor}</span>
    </span>
  );
}
