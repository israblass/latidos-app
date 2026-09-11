import { NextResponse } from "next/server";

import { leerIdDeQR } from "@/lib/qr/contenido";
import { confirmarCanje } from "@/lib/qr/confirmar-canje-transaccion";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { ResultadoCanje } from "@/types/configuracion";

/**
 * POST /api/qr/confirmar-canje — contrato del plan §3 "Confirmar canje de QR".
 *
 * Entrada: { contenido } — el id del QR o la URL que lo lleva. El usuario sale
 *          de la sesion, nunca del cuerpo.
 * Salida:  { beats_otorgados, beats_balance_actualizado, modo_evento_activo }
 * Errores: 401 sesion invalida
 *          409 el QR ya no sirve, con el motivo
 *
 * No confia en la validacion de /api/qr/validar: vuelve a comprobarlo todo de
 * forma atomica (plan, Decision Tecnica 3). Entre que la persona vio la
 * pantalla de confirmacion y toco el boton, otro pudo agotar el codigo o el
 * admin pudo apagarlo.
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

  const idQR = typeof contenido === "string" ? leerIdDeQR(contenido) : null;
  if (!idQR) {
    const sinCodigo: ResultadoCanje = { ok: false, motivo: "qr_invalido" };
    return NextResponse.json(sinCodigo, { status: 409 });
  }

  const resultado = await confirmarCanje(supabase, idQR);

  if (!resultado.ok) {
    if (resultado.motivo === "sesion_invalida") {
      return NextResponse.json({ error: "sesion_invalida" }, { status: 401 });
    }
    const fallo: ResultadoCanje = { ok: false, motivo: resultado.motivo };
    return NextResponse.json(fallo, { status: 409 });
  }

  // El modo evento solo decide el copy de cierre, asi que se lee aparte y no
  // dentro de la transaccion: que su lectura falle no puede tumbar un canje ya
  // otorgado.
  const { data: configuracion } = await supabase
    .from("configuracion_app")
    .select("modo_evento_activo")
    .limit(1)
    .maybeSingle();

  const exito: ResultadoCanje = {
    ok: true,
    beats_otorgados: resultado.beats_otorgados,
    beats_balance_actualizado: resultado.beats_balance_actualizado,
    modo_evento_activo: configuracion?.modo_evento_activo ?? false,
  };

  return NextResponse.json(exito);
}
