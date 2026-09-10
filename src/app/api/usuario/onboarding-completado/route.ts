import { NextResponse } from "next/server";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * POST /api/usuario/onboarding-completado — contrato del plan §3.
 *
 * Entrada: ninguna; el usuario sale de la sesion.
 * Salida:  { onboarding_visto: true }
 * Errores: 401 sesion invalida
 *
 * Marca el onboarding como visto para que no vuelva a mostrarse nunca mas
 * (spec §9 regla 5). Lo llaman tanto el boton "Empezar" como "Saltar".
 */
export async function POST() {
  const supabase = crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "sesion_invalida" }, { status: 401 });
  }

  const { error } = await supabase
    .from("usuarios")
    .update({ onboarding_visto: true })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "error_servidor", mensaje: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ onboarding_visto: true });
}
