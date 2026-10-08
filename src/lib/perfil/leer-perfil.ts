import { crearClienteServidor } from "@/lib/supabase/server";
import type { Usuario } from "@/types/usuario";

export type DatosPerfil = Pick<
  Usuario,
  "nombre" | "apellido" | "cedula" | "telefono" | "tipo_usuario" | "beats_balance" | "created_at"
>;

/**
 * Lo que muestra el Perfil v1, leido con la sesion de quien lo pide (RLS:
 * cada quien ve solo su fila y sus escaneos). Sin columnas nuevas: todo sale
 * de `usuarios` y `escaneos` tal como estan.
 *
 * `escaneos` es null si el conteo falla: la pantalla muestra "—" en vez de
 * inventar un cero.
 */
export async function leerDatosPerfil(
  id: string,
): Promise<{ datos: DatosPerfil | null; escaneos: number | null }> {
  const supabase = crearClienteServidor();
  const [fila, conteo] = await Promise.all([
    supabase
      .from("usuarios")
      .select("nombre, apellido, cedula, telefono, tipo_usuario, beats_balance, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("escaneos").select("id", { count: "exact", head: true }).eq("usuario_id", id),
  ]);
  return {
    datos: fila.data ?? null,
    escaneos: conteo.error ? null : (conteo.count ?? null),
  };
}
