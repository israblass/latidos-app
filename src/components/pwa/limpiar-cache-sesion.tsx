"use client";

import { useEffect } from "react";

import { limpiarDatosDeLaPersona } from "@/lib/sesion/cerrar-sesion";
import { crearClienteNavegador } from "@/lib/supabase/client";

/**
 * Borra la copia local de Beats al cerrar sesion (T044; plan §4, decision 14).
 *
 * Se engancha al evento de Auth y no al boton: cubre el cierre desde
 * cualquier lugar, el boton "Cerrar sesion" de Perfil incluido
 * (src/lib/sesion/cerrar-sesion.ts). La otra mitad, abrir la app con un
 * usuario distinto al guardado, la cubre la pantalla de Beats al comparar la
 * sesion con la copia.
 */
export function LimpiarCacheSesion() {
  useEffect(() => {
    const supabase = crearClienteNavegador();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") limpiarDatosDeLaPersona();
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
