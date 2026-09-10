import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { Usuario } from "@/types/usuario";

/** Campos del perfil que necesitan las pantallas de Fase 3. */
export type PerfilSesion = Pick<
  Usuario,
  "id" | "nombre" | "beats_balance" | "onboarding_visto" | "notificaciones_habilitadas"
>;

const CAMPOS =
  "id, nombre, beats_balance, onboarding_visto, notificaciones_habilitadas";

/**
 * Perfil de la persona que tiene la sesion abierta, o null si no hay sesion
 * (o si confirmo el correo pero su fila todavia no existe).
 */
export async function leerPerfilSesion(): Promise<PerfilSesion | null> {
  const supabase = crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select(CAMPOS)
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
}

/**
 * Exige sesion para entrar a una pantalla. Sin ella devuelve al registro, que
 * es donde empieza todo para quien no tiene cuenta.
 */
export async function exigirPerfil(): Promise<PerfilSesion> {
  const perfil = await leerPerfilSesion();
  if (!perfil) redirect("/registro/confirma-tu-correo");
  return perfil;
}
