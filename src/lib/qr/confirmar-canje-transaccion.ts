import type { SupabaseClient } from "@supabase/supabase-js";

import { inicioDelDia, ZONA_HORARIA } from "@/lib/fecha/limite-diario";
import type { Database } from "@/types/database";
import type { MotivoCanjeFallido } from "@/types/configuracion";

/**
 * Confirma el canje de un QR (T051, T052).
 *
 * Todo el trabajo ocurre dentro de la funcion `confirmar_canje_qr` de Postgres,
 * en una sola transaccion: revalida el QR, reserva el cupo, crea el registro de
 * Escaneo y suma los Beats al balance. Partirlo en varias llamadas desde aqui
 * dejaria huecos donde dos personas podrian pasar el mismo ultimo cupo, o donde
 * el contador subiria sin que llegue a existir el escaneo.
 *
 * Los Beats que quedan en el Escaneo son los del QR en este instante, copiados
 * a la fila (plan, Decision Tecnica 4): si el admin los cambia mañana, el
 * historico sigue diciendo lo que la persona gano hoy.
 *
 * El corte del dia se calcula aqui y viaja como parametro, para que la regla de
 * medianoche viva en un solo archivo.
 */

export type ResultadoTransaccion =
  | { ok: true; beats_otorgados: number; beats_balance_actualizado: number }
  | { ok: false; motivo: MotivoCanjeFallido };

/** Fecha del dia en curso en la zona del programa, como YYYY-MM-DD. */
function diaLocal(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

export async function confirmarCanje(
  supabase: SupabaseClient<Database>,
  idQR: string,
): Promise<ResultadoTransaccion> {
  const ahora = new Date();

  const { data, error } = await supabase.rpc("confirmar_canje_qr", {
    p_qr_marca_id: idQR,
    p_inicio_del_dia: inicioDelDia(ahora).toISOString(),
    p_dia_local: diaLocal(ahora),
  });

  if (error || !data) {
    console.error("[canje] la transaccion fallo:", error?.message);
    return { ok: false, motivo: "qr_invalido" };
  }

  return data as ResultadoTransaccion;
}
