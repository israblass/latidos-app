import { crearClienteServidor } from "@/lib/supabase/server";
import type { Usuario } from "@/types/usuario";

export type DatosPerfil = Pick<
  Usuario,
  | "nombre"
  | "apellido"
  | "cedula"
  | "telefono"
  | "tipo_usuario"
  | "beats_balance"
  | "avatar_path"
  | "created_at"
>;

const CAMPOS = "nombre, apellido, cedula, telefono, tipo_usuario, beats_balance, created_at";

/**
 * Lo que muestra el Perfil, leido con la sesion de quien lo pide (RLS: cada
 * quien ve solo su fila y sus escaneos).
 *
 * `avatar_path` llega con la migracion 20261008120000_avatar_path.sql. Si la
 * base todavia no la tiene (la app se desplego antes de correrla), el Perfil
 * no se rompe: se vuelve a leer sin esa columna y se muestran las iniciales.
 *
 * `escaneos` es null si el conteo falla: la pantalla muestra "—" en vez de
 * inventar un cero.
 */
export async function leerDatosPerfil(
  id: string,
): Promise<{ datos: DatosPerfil | null; escaneos: number | null }> {
  const supabase = crearClienteServidor();
  const leerFila = async (): Promise<DatosPerfil | null> => {
    const conFoto = await supabase
      .from("usuarios")
      .select(`${CAMPOS}, avatar_path`)
      .eq("id", id)
      .maybeSingle();
    if (!conFoto.error) return conFoto.data;
    const sinFoto = await supabase.from("usuarios").select(CAMPOS).eq("id", id).maybeSingle();
    return sinFoto.data ? { ...sinFoto.data, avatar_path: null } : null;
  };
  const [datos, conteo] = await Promise.all([
    leerFila(),
    supabase.from("escaneos").select("id", { count: "exact", head: true }).eq("usuario_id", id),
  ]);
  return { datos, escaneos: conteo.error ? null : (conteo.count ?? null) };
}
