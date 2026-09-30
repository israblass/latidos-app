"use client";

import { useEffect } from "react";

import { borrarTodasLasCaches } from "@/lib/beats/cache";
import { crearClienteNavegador } from "@/lib/supabase/client";

/**
 * Borra la copia local de Beats al cerrar sesion (T044; plan §4, decision 14).
 *
 * Hoy no existe un boton de cerrar sesion, asi que se engancha al evento de
 * Auth: cubre el cierre desde cualquier lugar, incluido el boton que llegue con
 * Perfil. La otra mitad, abrir la app con un usuario distinto al guardado, la
 * cubre la pantalla de Beats al comparar la sesion con la copia.
 */
export function LimpiarCacheSesion() {
  useEffect(() => {
    const supabase = crearClienteNavegador();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") borrarTodasLasCaches();
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
