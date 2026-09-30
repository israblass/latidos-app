"use client";

import Image from "next/image";
import { useState } from "react";

import {
  beatsConSigno,
  esMovimientoDeLatidos,
  horaDe,
  nombreMovimiento,
} from "@/lib/beats/formato";
import type { Movimiento } from "@/types/beats";

/** Lado del icono de la fila. */
const LADO = 36;

/**
 * Icono de la fila: el logo de la marca, un circulo con su inicial si no tiene
 * logo (o si el logo no carga), o el icono de Latidos en los movimientos de
 * Latidos (spec §7 paso 8, §8.7).
 */
function IconoFila({ movimiento }: { movimiento: Movimiento }) {
  const [logoRoto, setLogoRoto] = useState(false);

  if (esMovimientoDeLatidos(movimiento.tipo)) {
    return (
      <Image
        src="/icon-192.png"
        alt=""
        aria-hidden="true"
        width={LADO}
        height={LADO}
        className="shrink-0 rounded-full"
      />
    );
  }

  const nombre = movimiento.marca?.nombre ?? "";
  const logo = movimiento.marca?.logo_url;

  if (logo && !logoRoto) {
    return (
      // Un <img> y no next/image: los logos los sube el admin y pueden vivir en
      // cualquier dominio, y next/image exige declarar cada uno de antemano.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        width={LADO}
        height={LADO}
        loading="lazy"
        onError={() => setLogoRoto(true)}
        className="h-9 w-9 shrink-0 rounded-full bg-fondo object-contain"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secundario/10 text-[15px] font-bold text-secundario-texto"
    >
      {nombre.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/**
 * Un movimiento del historial (T022). Es una fila fija: ya dice todo lo que
 * hay que saber, asi que no se abre ni se toca (spec §11 criterio 10).
 */
export function FilaMovimiento({ movimiento }: { movimiento: Movimiento }) {
  const nombre = nombreMovimiento(movimiento.tipo, movimiento.marca);

  return (
    <li className="flex min-h-touch items-center gap-3 py-2">
      <IconoFila movimiento={movimiento} />
      <span className="min-w-0 flex-1 truncate text-[15px] text-texto-principal">
        {nombre}
      </span>
      <span className="shrink-0 text-right">
        {/* El signo en el color de texto normal: un ajuste que resta no es un
            error de la persona (spec §10.14). */}
        <span className="block text-[15px] font-medium text-texto-principal">
          {beatsConSigno(movimiento.beats)}
        </span>
        <span className="block text-xs text-texto-secundario">
          {horaDe(movimiento.ocurrido_en)}
        </span>
      </span>
    </li>
  );
}
