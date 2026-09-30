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

/**
 * Guardia de las pantallas protegidas nuevas (Perfil): sin sesion vuelve a la
 * bienvenida, donde estan "Registrarme" y "Ya tengo cuenta". Con sesion pero
 * sin perfil, o sin el onboarding visto, sigue las mismas reglas que Inicio.
 *
 * Inicio y Beats siguen mandando a /registro/confirma-tu-correo sin sesion:
 * cambiarlas queda fuera de esta tarea.
 */
export async function exigirSesionConPerfil(): Promise<{
  correo: string | null;
  perfil: PerfilSesion;
}> {
  const supabase = crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select(CAMPOS)
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) redirect("/registro/confirma-tu-correo");
  if (!perfil.onboarding_visto) redirect("/onboarding/pantalla-1");

  return { correo: user.email ?? null, perfil };
}

/** Hay una sesion valida en este dispositivo (sin mirar el perfil). */
export async function haySesion(): Promise<boolean> {
  const supabase = crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}
