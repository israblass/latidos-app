"use client";

import { useEffect } from "react";

/** Pantallas que no piden sesion: se pueden devolver tal como estaban. */
const ABIERTAS = ["/", "/entrar", "/sin-conexion"];
const esAbierta = (ruta: string) => ABIERTAS.includes(ruta) || ruta.startsWith("/registro");

/**
 * El boton atras del navegador puede devolver una pantalla desde la memoria
 * (bfcache), tal como quedo, con los datos de la persona pintados, sin pasar
 * por el servidor ni por ninguna guardia. Despues de cerrar sesion eso
 * mostraria, por ejemplo, el Perfil con el correo de quien acaba de salir.
 *
 * Si una pantalla protegida vuelve asi, se recarga: la guardia de siempre
 * decide otra vez, con la sesion que haya ahora. Con sesion, solo es un
 * refresco; sin ella, redirige antes de mostrar nada.
 */
export function RecargarAlVolver() {
  useEffect(() => {
    const alMostrar = (evento: PageTransitionEvent) => {
      if (evento.persisted && !esAbierta(window.location.pathname)) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", alMostrar);
    return () => window.removeEventListener("pageshow", alMostrar);
  }, []);

  return null;
}
