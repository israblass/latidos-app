"use client";

import { crearClienteNavegador } from "@/lib/supabase/client";
import type { PaginaHistorial, ResumenBeats } from "@/types/beats";

/**
 * Lecturas de la pantalla de Beats (plan §3). Corren en el navegador con la
 * sesion de la persona: las funciones de la base respetan la RLS, asi que cada
 * quien solo recibe lo suyo.
 *
 * Distinguen "no hay sesion o perfil" (devuelven null, y la pantalla redirige
 * igual que Inicio) de "no se pudo leer" (lanzan, y la pantalla muestra lo
 * guardado o el aviso de error). Confundir los dos casos expulsaria a alguien
 * con sesion solo porque se le cayo la señal.
 */

/** El historial se trae de a 7 dias (spec §10.7). */
export const DIAS_POR_LOTE = 7;

export class ErrorDeLectura extends Error {}

/** Codigos con los que PostgREST responde a una llamada sin sesion valida. */
const esSinSesion = (error: { code?: string; message?: string } | null, estado: number) =>
  estado === 401 || error?.code === "42501" || error?.code === "PGRST301";

export async function leerResumen(): Promise<ResumenBeats | null> {
  const supabase = crearClienteNavegador();
  const { data, error, status } = await supabase.rpc("resumen_beats");

  if (error) {
    if (esSinSesion(error, status)) return null;
    throw new ErrorDeLectura(error.message);
  }

  // Sin fila: hay sesion pero el perfil todavia no existe.
  const fila = Array.isArray(data) ? data[0] : null;
  return fila ?? null;
}

export async function leerHistorial(
  antesDe?: string | null,
  cantidadDias: number = DIAS_POR_LOTE,
): Promise<PaginaHistorial> {
  const supabase = crearClienteNavegador();
  const { data, error } = await supabase.rpc("historial_beats", {
    p_antes_de: antesDe ?? null,
    p_cantidad_dias: cantidadDias,
  });

  if (error || !data) throw new ErrorDeLectura(error?.message ?? "sin datos");
  return data as PaginaHistorial;
}

/** Nombre y logo actuales de una marca, para una fila que llega en vivo. */
export async function leerMarca(
  id: string,
): Promise<{ nombre: string; logo_url: string | null } | null> {
  const supabase = crearClienteNavegador();
  const { data, error } = await supabase
    .from("marcas")
    .select("nombre, logo_url")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new ErrorDeLectura(error.message);
  return data ?? null;
}
