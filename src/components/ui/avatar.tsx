"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useUrlFirmada } from "@/hooks/use-url-firmada";

interface Props {
  /** Lado del circulo en px. */
  tamano: number;
  /** Lo que se ve sin foto (y mientras carga): las iniciales... */
  iniciales?: string;
  /** ...o algo propio, como el corazon con audifonos de Inicio. Gana sobre `iniciales`. */
  respaldo?: ReactNode;
  /** Ruta en el bucket privado `avatares`: se muestra con una URL firmada. */
  ruta?: string | null;
  /** URL lista para mostrar (una vista previa local). Gana sobre `ruta`. */
  url?: string | null;
  /** Clases del circulo (el vidrio, el aro). */
  className?: string;
}

/**
 * Avatar reutilizable (constitution §2, v2.12.0; Inicio desde la v2.14.0):
 * circulo con las iniciales (o el `respaldo`) y, si hay foto, la foto encima
 * (object-fit cover, fundido de 200ms, sin fundido con movimiento reducido).
 * Las iniciales se quedan
 * debajo mientras la foto carga, sin red o si la foto falla: nunca un circulo
 * vacio ni un parpadeo. La foto es decorativa (`alt=""`): quien contiene el
 * avatar le pone nombre.
 */
export function Avatar({ tamano, iniciales, respaldo, ruta, url, className = "" }: Props) {
  const firmada = useUrlFirmada(url ? null : ruta);
  const fuente = url ?? firmada;
  const [cargada, setCargada] = useState<string | null>(null);
  const [fallida, setFallida] = useState<string | null>(null);

  useEffect(() => {
    setFallida(null);
  }, [fuente]);

  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center rounded-full font-display text-texto-principal ${className}`}
      style={{ width: tamano, height: tamano, fontSize: Math.round(tamano * 0.385) }}
      data-avatar=""
      data-con-foto={fuente && cargada === fuente ? "" : undefined}
    >
      {respaldo ?? iniciales}
      {fuente && fallida !== fuente ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fuente}
          alt=""
          decoding="async"
          onLoad={() => setCargada(fuente)}
          onError={() => setFallida(fuente)}
          className={`absolute inset-0 h-full w-full rounded-full object-cover transition-opacity duration-200 motion-reduce:transition-none ${
            cargada === fuente ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </span>
  );
}
