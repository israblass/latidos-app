import type { SupabaseClient } from "@supabase/supabase-js";

import { inicioDelDia } from "@/lib/fecha/limite-diario";
import { leerIdDeQR } from "@/lib/qr/contenido";
import type { Database } from "@/types/database";
import type { ResultadoValidacion } from "@/types/qr";

/**
 * Revisa si un QR se puede canjear: activo, con cupo, y no usado hoy por esta
 * persona (spec §9 reglas 9 y 10).
 *
 * Vive aparte del endpoint porque lo usan dos sitios: POST /api/qr/validar y la
 * pantalla de confirmacion, que necesita marca y Beats para pintarse.
 *
 * Esto NO reserva nada. Entre esta respuesta y la confirmacion el QR puede
 * agotarse o apagarse, y por eso el canje vuelve a comprobarlo todo de forma
 * atomica (plan, Decision Tecnica 3).
 */
export async function validarQR(
  supabase: SupabaseClient<Database>,
  usuarioId: string,
  contenido: string,
): Promise<ResultadoValidacion> {
  const invalido: ResultadoValidacion = { valido: false, motivo: "qr_invalido" };

  const idQR = leerIdDeQR(contenido);
  if (!idQR) {
    // Se registra el motivo real de cada rechazo porque desde afuera los tres
    // caminos a `qr_invalido` son indistinguibles a proposito, y sin esto la
    // unica forma de saber cual ocurrio es adivinar. Solo va el contenido leido,
    // que es publico: viaja impreso en el codigo.
    console.warn("[qr] descartado: el contenido no es un QR de Latidos:", contenido.slice(0, 120));
    return invalido;
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
    // O no existe, o esta inactivo: la policy de RLS esconde los inactivos, asi
    // que llegan por el mismo camino. Si esto aparece para un codigo del seed,
    // lo que falta es correr supabase/seed.sql en el proyecto que la app usa.
    console.warn("[qr] descartado: no hay QR activo con id", idQR);
    return invalido;
  }

  if (
    qr.limite_total_escaneos !== null &&
    qr.escaneos_totales_contador >= qr.limite_total_escaneos
  ) {
    return { valido: false, motivo: "limite_alcanzado" };
  }

  const { data: escaneoDeHoy } = await supabase
    .from("escaneos")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("qr_marca_id", qr.id)
    .gte("confirmado_en", inicioDelDia().toISOString())
    .limit(1)
    .maybeSingle();

  if (escaneoDeHoy) return { valido: false, motivo: "ya_escaneado_hoy" };

  const marca = qr.marcas as unknown as {
    nombre: string;
    logo_url: string | null;
  } | null;

  return {
    valido: true,
    qr_marca_id: qr.id,
    marca: { nombre: marca?.nombre ?? "Marca", logo_url: marca?.logo_url ?? null },
    beats_en_juego: qr.beats_otorgados,
  };
}
