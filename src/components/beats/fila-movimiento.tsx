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

/** Lado del icono de la fila (constitution §2, v2.8.0). */
const LADO = 40;

/**
 * Icono de la fila: el logo de la marca, un circulo azul al 12% con su inicial
 * si no tiene logo (o si el logo no carga), un circulo amarillo con corazon en
 * la bienvenida, o el icono de Latidos en los demas movimientos de Latidos
 * (spec §7 paso 8, §8.7).
 */
function IconoFila({ movimiento }: { movimiento: Movimiento }) {
  const [logoRoto, setLogoRoto] = useState(false);

  if (movimiento.tipo === "bienvenida") {
    return (
      <span
        aria-hidden="true"
        data-icono-bienvenida=""
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primario text-texto-principal"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" />
        </svg>
      </span>
    );
  }

  if (esMovimientoDeLatidos(movimiento.tipo)) {
    return (
      <Image
        src="/icons/icon-512.png"
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
        className="h-10 w-10 shrink-0 rounded-full bg-superficie object-contain"
      />
    );
  }

  return (
    // La letra en navy y no en azul: el azul de texto sobre el circulo azul
    // claro se quedaba en 4.48:1, justo bajo el AA.
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secundario/[0.12] text-[15px] font-bold text-texto-principal"
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
    <li className="flex min-h-touch items-center gap-3 py-3">
      <IconoFila movimiento={movimiento} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-texto-principal">{nombre}</span>
        <span className="block text-[13px] text-texto-secundario">{horaDe(movimiento.ocurrido_en)}</span>
      </span>
      {/* El signo en el color de texto normal: un ajuste que resta no es un
          error de la persona (spec §10.14). */}
      <span className="shrink-0 text-[15px] font-bold text-texto-principal">
        {beatsConSigno(movimiento.beats)}
      </span>
    </li>
  );
}
