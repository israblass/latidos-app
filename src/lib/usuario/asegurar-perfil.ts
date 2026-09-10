import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { esTipoUsuario, type DatosRegistroUsuario } from "@/types/usuario";

/**
 * Con la confirmacion de correo activada, al terminar el paso 6 todavia no hay
 * sesion, y sin sesion no se puede escribir la fila de `usuarios` bajo RLS. Los
 * datos declarados en el registro viajan mientras tanto en el `user_metadata`
 * del usuario de Auth, y esta funcion los baja a la tabla en cuanto el correo
 * queda confirmado y existe sesion.
 *
 * NO hace falta la service-role key: en este punto del flujo la peticion ya va
 * firmada por el propio usuario, y la policy `usuarios_insert_propio`
 * (auth.uid() = id) le permite escribir su fila y solo la suya.
 */

export type ResultadoPerfil =
  | { estado: "creado" | "existente" }
  | { estado: "sin_datos" | "error"; motivo: string };

/** Lee del user_metadata los 6 campos del registro, si estan completos. */
export function leerDatosRegistro(
  metadata: User["user_metadata"],
): DatosRegistroUsuario | null {
  const { cedula, nombre, apellido, telefono, correo, tipo_usuario } =
    metadata ?? {};

  if (
    typeof cedula !== "string" ||
    typeof nombre !== "string" ||
    typeof apellido !== "string" ||
    typeof telefono !== "string" ||
    typeof correo !== "string" ||
    !esTipoUsuario(tipo_usuario)
  ) {
    return null;
  }

  return { cedula, nombre, apellido, telefono, correo, tipo_usuario };
}

export async function asegurarPerfil(
  supabase: SupabaseClient<Database>,
  usuario: User,
): Promise<ResultadoPerfil> {
  const { data: existente, error: errorLectura } = await supabase
    .from("usuarios")
    .select("id")
    .eq("id", usuario.id)
    .maybeSingle();

  if (errorLectura) {
    return { estado: "error", motivo: errorLectura.message };
  }

  if (existente) {
    return { estado: "existente" };
  }

  const datos = leerDatosRegistro(usuario.user_metadata);
  if (!datos) {
    return {
      estado: "sin_datos",
      motivo: "El usuario de Auth no trae los datos del registro.",
    };
  }

  const { error: errorInsercion } = await supabase
    .from("usuarios")
    .insert({ id: usuario.id, ...datos });

  if (errorInsercion) {
    // Dos pestañas confirmando a la vez: la segunda choca contra la PK y la
    // fila ya existe, que es justo lo que se buscaba.
    if (errorInsercion.code === "23505") {
      return { estado: "existente" };
    }
    return { estado: "error", motivo: errorInsercion.message };
  }

  return { estado: "creado" };
}
