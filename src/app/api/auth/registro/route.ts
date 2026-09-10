import { NextResponse } from "next/server";

import { crearClienteServidor } from "@/lib/supabase/server";
import { asegurarPerfil } from "@/lib/usuario/asegurar-perfil";
import { registroCompletoSchema } from "@/lib/validacion/registro";

/**
 * POST /api/auth/registro — contrato del plan §3 "Registrar usuario".
 *
 * Entrada: { cedula, nombre, apellido, telefono, correo, tipo_usuario, contrasena }
 * Salida:  { usuario_id, sesion_token }
 * Errores: 400 campos faltantes o formato invalido
 *          409 correo ya registrado
 *
 * Sobre `sesion_token`: el proyecto tiene activada la confirmacion de correo,
 * asi que al terminar el paso 6 la cuenta existe pero TODAVIA no hay sesion.
 * En ese caso `sesion_token` viaja en null y el cliente manda a la pantalla de
 * "confirma tu correo". Si el proyecto tuviera la confirmacion apagada, la
 * sesion llega de una vez y el campo trae el access token, sin cambiar la forma
 * de la respuesta.
 *
 * El perfil (tabla `usuarios`) no se escribe aqui cuando la confirmacion esta
 * pendiente: sin sesion no hay como pasar RLS. Los datos del registro quedan
 * en el `user_metadata` del usuario de Auth y bajan a la tabla en
 * `/auth/confirmar`, cuando ya existe sesion.
 */
export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { error: "datos_invalidos", campos: {} },
      { status: 400 },
    );
  }

  const validacion = registroCompletoSchema.safeParse(cuerpo);
  if (!validacion.success) {
    const campos: Record<string, string> = {};
    for (const issue of validacion.error.issues) {
      const campo = String(issue.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = issue.message;
    }
    return NextResponse.json({ error: "datos_invalidos", campos }, { status: 400 });
  }

  const { contrasena, correo, ...perfil } = validacion.data;
  const supabase = crearClienteServidor();

  const { data: datosAuth, error: errorAuth } = await supabase.auth.signUp({
    email: correo,
    password: contrasena,
    options: {
      // Los 6 campos del registro esperan aqui hasta que haya sesion.
      data: { correo, ...perfil },
      emailRedirectTo: new URL("/auth/confirmar", request.url).toString(),
    },
  });

  if (errorAuth) {
    const yaRegistrado =
      errorAuth.code === "user_already_exists" || errorAuth.status === 422;
    if (yaRegistrado) {
      return NextResponse.json({ error: "correo_ya_registrado" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "error_servidor", mensaje: errorAuth.message },
      { status: 500 },
    );
  }

  const usuario = datosAuth.user;

  if (!usuario) {
    return NextResponse.json({ error: "error_servidor" }, { status: 500 });
  }

  // Con la confirmacion de correo activada, Supabase no delata que un correo ya
  // existe: responde 200 con un usuario de relleno y la lista de identidades
  // vacia. Es la unica señal disponible para cumplir el 409 del contrato.
  if (usuario.identities && usuario.identities.length === 0) {
    return NextResponse.json({ error: "correo_ya_registrado" }, { status: 409 });
  }

  // Camino alterno: si el proyecto no exige confirmacion, la sesion llega ya y
  // el perfil se puede escribir de una vez.
  if (datosAuth.session) {
    const resultado = await asegurarPerfil(supabase, usuario);
    if (resultado.estado === "error" || resultado.estado === "sin_datos") {
      return NextResponse.json(
        { error: "error_servidor", mensaje: resultado.motivo },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    {
      usuario_id: usuario.id,
      sesion_token: datosAuth.session?.access_token ?? null,
    },
    { status: 201 },
  );
}
