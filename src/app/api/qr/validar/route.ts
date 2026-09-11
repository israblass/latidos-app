import { NextResponse } from "next/server";

import { validarQR } from "@/lib/qr/validar";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { ResultadoValidacion } from "@/types/qr";

/**
 * POST /api/qr/validar — contrato del plan §3 "Leer QR (validar)".
 *
 * Entrada: { contenido } — lo que leyo la camara. El usuario sale de la sesion.
 * Salida:  { valido: true, qr_marca_id, marca: { nombre, logo_url }, beats_en_juego }
 *        | { valido: false, motivo: "ya_escaneado_hoy" | "limite_alcanzado" | "qr_invalido" }
 * Errores: 401 sesion invalida
 *
 * Dice si el QR sirve y cuantos Beats estarian en juego, sin otorgar nada ni
 * tocar ningun contador. Otorgar es cosa de /api/qr/confirmar-canje.
 *
 * Un QR inexistente, apagado o ilegible responden todos `qr_invalido`: desde
 * afuera no hay forma de distinguirlos, y asi no se puede sondear que codigos
 * existen.
 */
export async function POST(request: Request) {
  const supabase = crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "sesion_invalida" }, { status: 401 });
  }

  let contenido: unknown;
  try {
    contenido = (await request.json())?.contenido;
  } catch {
    contenido = null;
  }

  const invalido: ResultadoValidacion = { valido: false, motivo: "qr_invalido" };
  if (typeof contenido !== "string") {
    return NextResponse.json(invalido);
  }

  return NextResponse.json(await validarQR(supabase, user.id, contenido));
}
