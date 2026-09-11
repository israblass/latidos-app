import { NextResponse } from "next/server";

import { inicioDelDia } from "@/lib/fecha/limite-diario";
import { leerIdDeQR } from "@/lib/qr/contenido";
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
 * Esta fase llega hasta aqui: dice si el QR sirve y cuantos Beats estarian en
 * juego, sin otorgar nada ni tocar ningun contador. El canje es de la Fase 5.
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

  const idQR = leerIdDeQR(contenido);
  if (!idQR) {
    return NextResponse.json(invalido);
  }

  // La policy de RLS solo deja leer los QR activos, asi que uno inactivo no
  // aparece y cae en el mismo camino que uno que no existe.
  const { data: qr } = await supabase
    .from("qr_marca")
    .select(
      "id, beats_otorgados, limite_total_escaneos, escaneos_totales_contador, marcas ( nombre, logo_url )",
    )
    .eq("id", idQR)
    .maybeSingle();

  if (!qr) {
    return NextResponse.json(invalido);
  }

  // Limite total del codigo (spec §9 regla 9).
  if (
    qr.limite_total_escaneos !== null &&
    qr.escaneos_totales_contador >= qr.limite_total_escaneos
  ) {
    return NextResponse.json({ valido: false, motivo: "limite_alcanzado" });
  }

  // Una vez por dia por persona, con corte a medianoche (spec §9 regla 10).
  const { data: escaneoDeHoy } = await supabase
    .from("escaneos")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("qr_marca_id", qr.id)
    .gte("confirmado_en", inicioDelDia().toISOString())
    .limit(1)
    .maybeSingle();

  if (escaneoDeHoy) {
    return NextResponse.json({ valido: false, motivo: "ya_escaneado_hoy" });
  }

  // `marcas` llega como objeto por la relacion, pero el tipado generico de la
  // consulta no lo estrecha solo.
  const marca = qr.marcas as unknown as {
    nombre: string;
    logo_url: string | null;
  } | null;

  const resultado: ResultadoValidacion = {
    valido: true,
    qr_marca_id: qr.id,
    marca: { nombre: marca?.nombre ?? "Marca", logo_url: marca?.logo_url ?? null },
    beats_en_juego: qr.beats_otorgados,
  };

  return NextResponse.json(resultado);
}
