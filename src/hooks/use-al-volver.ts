"use client";

import { useEffect, useRef } from "react";

/**
 * Llama a `alVolver` cuando la app vuelve a primer plano o recupera la red:
 * `visibilitychange` a visible, `pageshow` desde la cache de ida y vuelta, y
 * `online`.
 *
 * En el telefono, con la pantalla bloqueada o la app en segundo plano, el
 * socket de tiempo real se suspende y lo que llego mientras tanto no aparece.
 * Volver a pedir los datos al regresar es lo unico que lo garantiza.
 *
 * Como mucho una llamada cada `intervaloMs`: al desbloquear suelen llegar dos
 * o tres de estos eventos casi juntos. Si uno cae dentro del intervalo, no se
 * pierde: queda una sola llamada pendiente para cuando se cumpla.
 */
export const INTERVALO_REFRESCO_MS = 5000;

export function useAlVolver(
  alVolver: () => void,
  { activo = true, intervaloMs = INTERVALO_REFRESCO_MS }: { activo?: boolean; intervaloMs?: number } = {},
) {
  const manejador = useRef(alVolver);
  manejador.current = alVolver;

  useEffect(() => {
    if (!activo) return;
    let ultima = 0;
    let pendiente: number | null = null;

    const disparar = () => {
      ultima = Date.now();
      manejador.current();
    };

    const pedir = () => {
      if (pendiente !== null) return;
      const espera = ultima + intervaloMs - Date.now();
      if (espera <= 0) {
        disparar();
        return;
      }
      pendiente = window.setTimeout(() => {
        pendiente = null;
        disparar();
      }, espera);
    };

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") pedir();
    };
    const alMostrarse = (evento: PageTransitionEvent) => {
      if (evento.persisted) pedir();
    };

    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("pageshow", alMostrarse);
    window.addEventListener("online", pedir);
    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("pageshow", alMostrarse);
      window.removeEventListener("online", pedir);
      if (pendiente !== null) window.clearTimeout(pendiente);
    };
  }, [activo, intervaloMs]);
}
