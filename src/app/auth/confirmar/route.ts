import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { crearClienteServidor } from "@/lib/supabase/server";
import { asegurarPerfil } from "@/lib/usuario/asegurar-perfil";

/**
 * GET /auth/confirmar — destino del enlace de confirmacion de correo.
 *
 * Acepta las dos formas en que Supabase puede devolver a la persona:
 *
 * - `token_hash` + `type`: la que se usa cuando la plantilla del correo apunta
 *   aqui con `{{ .TokenHash }}`. Funciona aunque el enlace se abra en otro
 *   dispositivo o navegador distinto al del registro.
 * - `code`: el intercambio PKCE. Solo sirve en el mismo navegador donde se
 *   hizo el registro, porque el verificador vive en una cookie de ese
 *   navegador.
 *
 * Con la sesion ya creada, baja el perfil del `user_metadata` a la tabla
 * `usuarios` y manda al onboarding.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const aError = (motivo: string) =>
    NextResponse.redirect(
      `${origin}/registro/confirma-tu-correo?error=${encodeURIComponent(motivo)}`,
    );

  const supabase = crearClienteServidor();

  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo,
      token_hash: tokenHash,
    });
    if (error) return aError("enlace_invalido");
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return aError("enlace_invalido");
  } else {
    return aError("enlace_incompleto");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return aError("sesion_no_creada");

  const resultado = await asegurarPerfil(supabase, user);
  if (resultado.estado === "error" || resultado.estado === "sin_datos") {
    return aError("perfil_no_creado");
  }

  // El onboarding decide si toca mostrarse o mandar directo a Inicio.
  return NextResponse.redirect(`${origin}/onboarding/pantalla-1`);
}
