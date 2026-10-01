import { beatsDeLaSemana } from "@/lib/beats/actividad";
import { diaLocalDe } from "@/lib/beats/formato";
import type { DiaHistorial, Movimiento } from "@/types/beats";

/**
 * Lo que el dashboard de Beats (constitution §2, v2.8.0) calcula del historial
 * que ya trae la pantalla. Son funciones puras, sin red ni pantalla.
 *
 * Criterio de marca: un movimiento es "de una marca" si es un escaneo
 * (`tipo === "escaneo"`) y trae su marca. La bienvenida, los regalos y los
 * ajustes son de Latidos: suman Beats y cuentan como dia activo, pero no son
 * marca ni escaneo de marca.
 */

export const esMovimientoDeMarca = (
  m: Movimiento,
): m is Movimiento & { marca: NonNullable<Movimiento["marca"]> } =>
  m.tipo === "escaneo" && m.marca !== null;

/** Resta `n` dias a una fecha "AAAA-MM-DD" (sin horas ni zona de por medio). */
function restarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Los dias del historial que caen en los ultimos 7 dias calendario de Caracas. */
function diasDeLaSemana(dias: DiaHistorial[], ahora: Date): DiaHistorial[] {
  const hoy = diaLocalDe(ahora);
  const desde = restarDias(hoy, 6);
  return dias.filter((d) => d.dia_local >= desde && d.dia_local <= hoy);
}

export type MetricasSemana = {
  /** Suma con signo de todos los movimientos de la semana. */
  beats: number;
  /** Escaneos de marca. */
  escaneos: number;
  /** Marcas distintas escaneadas. */
  marcas: number;
  /** Dias locales distintos con al menos un movimiento. */
  diasActivos: number;
};

/** "Tu pulso": la semana (hoy y los 6 dias anteriores, en hora de Caracas). */
export function metricasDeLaSemana(dias: DiaHistorial[], ahora: Date = new Date()): MetricasSemana {
  const semana = diasDeLaSemana(dias, ahora);
  const deMarca = semana.flatMap((d) => d.movimientos).filter(esMovimientoDeMarca);
  return {
    beats: beatsDeLaSemana(dias, ahora),
    escaneos: deMarca.length,
    marcas: new Set(deMarca.map((m) => m.marca.nombre)).size,
    diasActivos: semana.filter((d) => d.movimientos.length > 0).length,
  };
}

export type ResumenMarca = {
  nombre: string;
  logo_url: string | null;
  escaneos: number;
  beats: number;
};

/**
 * Las marcas donde la persona ha sumado, agrupadas por nombre (el historial
 * trae el nombre y el logo actuales de cada marca, asi que una marca
 * renombrada se agrupa bajo su nombre nuevo). Van de la escaneada mas
 * recientemente a la mas antigua. Cubre el historial cargado en pantalla.
 */
export function marcasDelHistorial(dias: DiaHistorial[]): ResumenMarca[] {
  const porNombre = new Map<string, ResumenMarca>();
  for (const m of dias.flatMap((d) => d.movimientos)) {
    if (!esMovimientoDeMarca(m)) continue;
    const actual = porNombre.get(m.marca.nombre);
    if (actual) {
      actual.escaneos += 1;
      actual.beats += m.beats;
      actual.logo_url ??= m.marca.logo_url;
    } else {
      porNombre.set(m.marca.nombre, {
        nombre: m.marca.nombre,
        logo_url: m.marca.logo_url,
        escaneos: 1,
        beats: m.beats,
      });
    }
  }
  return Array.from(porNombre.values());
}
