"use client";

import { useEffect, useRef, useState } from "react";

import { ContadorAnimado } from "@/components/escaneo/contador-animado";
import { ContadorBeats } from "@/components/marca/contador-beats";

/**
 * Contador de la pantalla de Beats (T036). Al entrar muestra el numero directo
 * (spec §10.11); si el saldo cambia con la pantalla abierta, anima del valor
 * anterior al nuevo con el mismo contador del escaneo y un latido rapido del
 * halo. ContadorAnimado ya respeta `prefers-reduced-motion`: con esa
 * preferencia el numero cambia sin animar.
 */
export function ContadorBeatsVivo({
  valor,
  variante = "halo",
}: {
  valor: number;
  /**
   * "halo": el contador de la pantalla de Beats (navy, barra y halo
   * amarillos).
   * "plano": digitos navy sin barra ni halo, para las tarjetas de vidrio del
   * Inicio y de Beats (constitution §2, v2.7.0 y v2.9.0).
   * El conteo animado es el mismo en todas.
   */
  variante?: "halo" | "plano";
}) {
  const anterior = useRef(valor);
  const [animacion, setAnimacion] = useState<{ desde: number; hasta: number; vez: number } | null>(
    null,
  );

  useEffect(() => {
    if (valor === anterior.current) return;
    const desde = anterior.current;
    anterior.current = valor;
    setAnimacion((previa) => ({ desde, hasta: valor, vez: (previa?.vez ?? 0) + 1 }));
  }, [valor]);

  const animado = animacion ? (
    // La key reinicia la animacion en cada cambio, aunque llegue otro antes de
    // que termine el anterior.
    <ContadorAnimado key={animacion.vez} desde={animacion.desde} hasta={animacion.hasta} />
  ) : undefined;

  if (variante === "plano") {
    return (
      <p className="font-display text-[68px] leading-none tracking-[0.01em] text-texto-principal">
        {animado ?? valor}
      </p>
    );
  }

  return (
    <ContadorBeats
      valor={valor}
      recienSumado={Boolean(animacion)}
      numero={animado}
    />
  );
}
