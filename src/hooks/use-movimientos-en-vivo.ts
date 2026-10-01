"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

import { crearClienteNavegador } from "@/lib/supabase/client";
import type { MovimientoBeats } from "@/types/beats";

/**
 * Suscripcion en vivo a los movimientos nuevos de la persona (T034; plan §3,
 * "Suscripcion en vivo a movimientos").
 *
 * Escucha las inserciones en `movimientos_beats` filtradas por su usuario. El
 * filtro es comodidad, no seguridad: la RLS de la tabla es la que impide que
 * lleguen filas ajenas.
 *
 * Tolerante a la caida del canal (spec §8.6): si se cae no se muestra nada a
 * la persona. Si el canal pasa a CHANNEL_ERROR, TIMED_OUT o CLOSED sin que lo
 * hayamos cerrado nosotros, se rehace con esperas crecientes y un tope de
 * intentos, para no quedar en un bucle. Agotados los intentos, se vuelve a
 * probar cuando el telefono avisa que recupero la red. Al volver a quedar
 * suscrito se llama a `alReconectar`: lo que llego mientras el canal estaba
 * caido no va a llegar por el canal, hay que pedirlo.
 */

/** Esperas antes de cada reintento; su largo es el tope de intentos. */
export const ESPERAS_RESUSCRIPCION_MS = [1000, 2000, 4000, 8000, 15000];

export function useMovimientosEnVivo(
  usuarioId: string | null,
  alInsertar: (fila: MovimientoBeats) => void,
  alReconectar?: () => void,
) {
  // Las funciones cambian en cada render; el canal no tiene por que rehacerse.
  const manejador = useRef(alInsertar);
  manejador.current = alInsertar;
  const reconectado = useRef(alReconectar);
  reconectado.current = alReconectar;

  useEffect(() => {
    if (!usuarioId) return;

    const supabase = crearClienteNavegador();
    let canal: RealtimeChannel | null = null;
    let desmontado = false;
    let intentos = 0;
    let huboCaida = false;
    let temporizador: number | null = null;

    const suscribir = () => {
      if (desmontado) return;
      const este = supabase
        .channel(`movimientos-beats-${usuarioId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "movimientos_beats",
            filter: `usuario_id=eq.${usuarioId}`,
          },
          (cambio) => manejador.current(cambio.new as MovimientoBeats),
        );
      canal = este;
      este.subscribe((estado) => {
        // Avisos de un canal que ya se reemplazo o se cerro a proposito.
        if (desmontado || canal !== este) return;
        if (estado === "SUBSCRIBED") {
          intentos = 0;
          if (huboCaida) {
            huboCaida = false;
            reconectado.current?.();
          }
          return;
        }
        if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT" || estado === "CLOSED") {
          huboCaida = true;
          programarReintento();
        }
      });
    };

    const programarReintento = () => {
      if (desmontado || temporizador !== null) return;
      const viejo = canal;
      canal = null;
      // Se saca el canal caido: con el mismo nombre, supabase devolveria el
      // viejo en vez de crear uno nuevo.
      if (viejo) void supabase.removeChannel(viejo).catch(() => null);
      if (intentos >= ESPERAS_RESUSCRIPCION_MS.length) return;
      const espera = ESPERAS_RESUSCRIPCION_MS[intentos];
      intentos += 1;
      temporizador = window.setTimeout(() => {
        temporizador = null;
        suscribir();
      }, espera);
    };

    // Intentos agotados y vuelve la red: una tanda nueva.
    const alVolverLaRed = () => {
      if (canal || temporizador !== null || desmontado) return;
      intentos = 0;
      suscribir();
    };

    suscribir();
    window.addEventListener("online", alVolverLaRed);

    return () => {
      desmontado = true;
      window.removeEventListener("online", alVolverLaRed);
      if (temporizador !== null) window.clearTimeout(temporizador);
      if (canal) void supabase.removeChannel(canal);
    };
  }, [usuarioId]);
}

/** Id de la persona con sesion, leido de la sesion local (sin ir a la red). */
export async function leerUsuarioDeSesion(): Promise<string | null> {
  const supabase = crearClienteNavegador();
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
