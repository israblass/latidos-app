"use client";

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
 * Tolerante a la caida del canal (spec §8.6): si se cae no se muestra nada.
 * realtime-js reintenta solo, y si no lo logra la pantalla se pone al dia la
 * proxima vez que se entra.
 */
export function useMovimientosEnVivo(
  usuarioId: string | null,
  alInsertar: (fila: MovimientoBeats) => void,
) {
  // La funcion cambia en cada render; el canal no tiene por que rehacerse.
  const manejador = useRef(alInsertar);
  manejador.current = alInsertar;

  useEffect(() => {
    if (!usuarioId) return;

    const supabase = crearClienteNavegador();
    const canal = supabase
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
      )
      // Sin callback de error a proposito: un canal caido no es algo que la
      // persona tenga que ver ni resolver.
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [usuarioId]);
}

/** Id de la persona con sesion, leido de la sesion local (sin ir a la red). */
export async function leerUsuarioDeSesion(): Promise<string | null> {
  const supabase = crearClienteNavegador();
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
