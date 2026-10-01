import { diaLocalDe } from "@/lib/beats/formato";
import type { DiaHistorial, Movimiento } from "@/types/beats";

/**
 * Lo que el Inicio muestra de la actividad (constitution §2, v2.6.0). Son
 * funciones puras sobre el historial por dias, para probarlas sin pantalla.
 */

/** Los `cantidad` movimientos mas recientes, del dia mas nuevo al mas viejo. */
export function movimientosRecientes(dias: DiaHistorial[], cantidad = 3): Movimiento[] {
  return dias.flatMap((d) => d.movimientos).slice(0, cantidad);
}

/** Resta `n` dias a una fecha "AAAA-MM-DD" (sin horas ni zona de por medio). */
function restarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d - n)).toISOString().slice(0, 10);
}

/**
 * Suma de los Beats de los ultimos 7 dias calendario en hora de Caracas,
 * hoy incluido. Puede dar 0 o negativa (un ajuste que resta): el chip solo se
 * muestra si es positiva.
 */
export function beatsDeLaSemana(dias: DiaHistorial[], ahora: Date = new Date()): number {
  const hoy = diaLocalDe(ahora);
  const desde = restarDias(hoy, 6);
  return dias
    .filter((d) => d.dia_local >= desde && d.dia_local <= hoy)
    .reduce((total, d) => total + d.movimientos.reduce((t, m) => t + m.beats, 0), 0);
}
