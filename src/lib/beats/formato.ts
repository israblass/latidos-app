import { ZONA_HORARIA } from "@/lib/fecha/limite-diario";
import type { TipoMovimiento } from "@/types/beats";

/**
 * Formato de la pantalla de Beats. Todo se calcula en la zona del programa, no
 * en la del telefono (spec §9 regla 8): "HOY" tiene que ser el mismo dia que
 * usa el limite diario de escaneo, y un telefono con otra zona no puede mover
 * un escaneo al dia siguiente.
 */

const DIAS_SEMANA = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

// "SEPT" y no "SEP": asi lo escribe la spec (§10.6) y asi se lee en Venezuela.
const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEPT", "OCT", "NOV", "DIC"];

/** YYYY-MM-DD de un instante en la zona del programa. */
export function diaLocalDe(instante: Date, zona: string = ZONA_HORARIA): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

/** Resta dias a una fecha YYYY-MM-DD sin pasar por ninguna zona horaria. */
function restarDias(dia: string, cantidad: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d - cantidad));
  return fecha.toISOString().slice(0, 10);
}

/**
 * "HOY", "AYER" o el dia de la semana con la fecha, sin año:
 * "MIÉRCOLES 30 SEPT" (spec §10.6).
 */
export function etiquetaDia(dia: string, ahora: Date = new Date()): string {
  const hoy = diaLocalDe(ahora);
  if (dia === hoy) return "HOY";
  if (dia === restarDias(hoy, 1)) return "AYER";

  // La fecha ya es un dia calendario: se lee en UTC para que ninguna zona la
  // corra un dia hacia atras.
  const [a, m, d] = dia.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return `${DIAS_SEMANA[fecha.getUTCDay()]} ${d} ${MESES[m - 1]}`;
}

/** Hora de 12 horas con am/pm: "3:45 pm" (spec §10.5). */
export function horaDe(instante: string | Date, zona: string = ZONA_HORARIA): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(new Date(instante))
      .map(({ type, value }) => [type, value]),
  );
  return `${partes.hour}:${partes.minute} ${String(partes.dayPeriod).toLowerCase()}`;
}

/**
 * Beats con signo: "+10", "-3". El menos va en el color de texto normal, no en
 * rojo (spec §10.14): un ajuste no es un error de la persona.
 */
export function beatsConSigno(beats: number): string {
  return beats > 0 ? `+${beats}` : `-${Math.abs(beats)}`;
}

/** "1 escaneo", "3 escaneos". */
export function conteoEscaneos(cantidad: number): string {
  return cantidad === 1 ? "1 escaneo" : `${cantidad} escaneos`;
}

/** Nombre fijo de los movimientos que no vienen de una marca (spec §10.19). */
const NOMBRES_LATIDOS: Record<Exclude<TipoMovimiento, "escaneo">, string> = {
  bienvenida: "Bienvenida a Latidos",
  ajuste: "Ajuste Latidos",
  regalo: "Regalo Latidos",
  // Tipos que todavia no ocurren: sus historias fijaran el nombre definitivo.
  donacion: "Donación",
  voluntariado: "Voluntariado",
  prediccion: "Predicción",
  canje: "Canje",
};

export function nombreMovimiento(
  tipo: TipoMovimiento,
  marca: { nombre: string } | null,
): string {
  if (tipo === "escaneo") return marca?.nombre ?? "Marca";
  return NOMBRES_LATIDOS[tipo];
}

/** Los movimientos de Latidos llevan el icono de Latidos y no una marca. */
export const esMovimientoDeLatidos = (tipo: TipoMovimiento) => tipo !== "escaneo";

/**
 * Cuando es una copia guardada, dicho como lo lee el aviso sin conexion
 * (spec §8.2): "a las 3:40 pm" si fue hoy, "ayer, 9:10 pm" si fue ayer, y
 * "el 28 sept, 9:10 pm" si fue antes.
 */
export function momentoDeLaCopia(instante: string, ahora: Date = new Date()): string {
  const hora = horaDe(instante);
  const dia = diaLocalDe(new Date(instante));
  const etiqueta = etiquetaDia(dia, ahora);
  if (etiqueta === "HOY") return `a las ${hora}`;
  if (etiqueta === "AYER") return `ayer, ${hora}`;
  // "MIÉRCOLES 23 SEPT" -> "el 23 sept"
  const [, numero, mes] = etiqueta.split(" ");
  return `el ${numero} ${mes.toLowerCase()}, ${hora}`;
}
