"use client";

import { BarraAcento } from "@/components/marca/titulo-con-acento";

/**
 * Contador de Beats: la firma visual de la app (constitution §2).
 *
 * El numero va en navy y no en amarillo. El `#FDFB05` no alcanza contraste
 * sobre una superficie clara, y la card dejo de ser oscura: el amarillo pasa a
 * la barra de acento y al halo de detras, donde no tiene que leerse como texto.
 *
 * El halo late despacio para que la card no quede inerte. Esta detras del
 * numero y a opacidad baja, asi que el contraste del numero no depende del
 * momento del ciclo en que se mire: en el punto de mas opacidad el amarillo
 * sigue siendo una luz de fondo, no una superficie.
 */
export function ContadorBeats({
  valor,
  /** Un ciclo rapido al acabar de sumar, en vez del latido de reposo. */
  recienSumado = false,
}: {
  valor: number;
  recienSumado?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {/*
        El halo no se anima con prefers-reduced-motion: se queda quieto, que es
        justo lo que la preferencia pide. El gradiente sigue ahi, solo deja de
        respirar.
      */}
      <div
        aria-hidden="true"
        className={`halo-beats pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 motion-reduce:animate-none ${
          recienSumado ? "animate-latido-rapido" : "animate-latido"
        }`}
      />

      <p className="font-display relative text-[76px] leading-none text-texto-principal">
        {valor}
      </p>

      <BarraAcento className="relative mt-3" />

      <p className="etiqueta relative mt-3 text-texto-secundario">Beats</p>
    </div>
  );
}
