import { NextResponse } from "next/server";

import { crearClienteServidor } from "@/lib/supabase/server";
import { registroCompletoSchema } from "@/lib/validacion/registro";

/**
 * POST /api/auth/registro
 *
 * Crea la cuenta con los 6 campos del registro por pasos. Es el UNICO punto
 * de guardado del formulario: no hay persistencia parcial (spec §9 regla 1).
 *
 * Respuestas:
 *  201 { ok: true, usuario: { id, nombre, beats_balance, onboarding_visto } }
 *  400 { ok: false, codigo: "datos_invalidos", campos: { campo: mensaje } }
 *  409 { ok: false, codigo: "correo_en_uso", mensaje }
 *  500 { ok: false, codigo: "error_servidor" | "perfil_no_creado", mensaje }
 *
 * Al responder 201 las cookies de sesion ya viajan en la respuesta, asi que
 * la persona queda con sesion iniciada de forma persistente (spec §9 regla 4).
 */
export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, codigo: "datos_invalidos", campos: {} },
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
    return NextResponse.json(
      { ok: false, codigo: "datos_invalidos", campos },
      { status: 400 },
    );
  }

  const { contrasena, correo, ...perfil } = validacion.data;
  const supabase = crearClienteServidor();

  const { data: datosAuth, error: errorAuth } = await supabase.auth.signUp({
    email: correo,
    password: contrasena,
  });

  if (errorAuth) {
    const yaRegistrado =
      errorAuth.code === "user_already_exists" || errorAuth.status === 422;
    return NextResponse.json(
      {
        ok: false,
        codigo: yaRegistrado ? "correo_en_uso" : "error_servidor",
        mensaje: yaRegistrado
          ? "Ese correo ya tiene una cuenta en Latidos."
          : "No pudimos crear tu cuenta. Intenta de nuevo.",
      },
      { status: yaRegistrado ? 409 : 500 },
    );
  }

  // Sin sesion no hay forma de escribir el perfil bajo RLS: pasa si en el
  // proyecto de Supabase esta activada la confirmacion de correo, que esta
  // fase no contempla (el registro deja la sesion iniciada de inmediato).
  if (!datosAuth.user || !datosAuth.session) {
    return NextResponse.json(
      {
        ok: false,
        codigo: "error_servidor",
        mensaje: "No pudimos iniciar tu sesion. Intenta de nuevo.",
      },
      { status: 500 },
    );
  }

  const { data: usuario, error: errorPerfil } = await supabase
    .from("usuarios")
    .insert({
      id: datosAuth.user.id,
      correo,
      ...perfil,
    })
    .select("id, nombre, beats_balance, onboarding_visto")
    .single();

  if (errorPerfil || !usuario) {
    return NextResponse.json(
      {
        ok: false,
        codigo: "perfil_no_creado",
        mensaje: "Creamos tu acceso pero no tus datos. Intenta de nuevo.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, usuario }, { status: 201 });
}
