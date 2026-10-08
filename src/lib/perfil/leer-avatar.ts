import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Ruta de la foto de perfil (`usuarios.avatar_path`) para el avatar de
 * Inicio. Va aparte de las guardias de sesion a proposito: si la columna
 * falta o la lectura falla, Inicio sigue igual y muestra el corazon con
 * audifonos.
 */
export async function leerAvatarPath(id: string): Promise<string | null> {
  const { data, error } = await crearClienteServidor()
    .from("usuarios")
    .select("avatar_path")
    .eq("id", id)
    .maybeSingle();
  return error ? null : (data?.avatar_path ?? null);
}
