import { NextResponse } from "next/server";
import { z } from "zod";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * POST /api/usuario/notificaciones — contrato del plan §3.
 *
 * Entrada: { permiso_otorgado: boolean, push_subscription? }
 * Salida:  { notificaciones_habilitadas: boolean }
 * Errores: 401 sesion invalida
 *
 * El usuario sale de la sesion, no del cuerpo: aceptar un usuario_id del
 * cliente dejaria escribir sobre el perfil de otra persona.
 *
 * `push_subscription` se acepta por contrato pero todavia no se guarda: la
 * tabla `usuarios` solo tiene la bandera, y almacenar la suscripcion pide su
 * propia columna, que corresponde a cuando se construya el envio de push.
 */
const cuerpoSchema = z.object({
  permiso_otorgado: z.boolean(),
  push_subscription: z.unknown().optional(),
});

export async function POST(request: Request) {
  const supabase = crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "sesion_invalida" }, { status: 401 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "datos_invalidos" }, { status: 400 });
  }

  const validacion = cuerpoSchema.safeParse(cuerpo);
  if (!validacion.success) {
    return NextResponse.json({ error: "datos_invalidos" }, { status: 400 });
  }

  const habilitadas = validacion.data.permiso_otorgado;

  const { error } = await supabase
    .from("usuarios")
    .update({ notificaciones_habilitadas: habilitadas })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "error_servidor", mensaje: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ notificaciones_habilitadas: habilitadas });
}
