import type { DiaHistorial, Movimiento, TipoMovimiento } from "@/types/beats";

/**
 * Mete un movimiento que llega en vivo en su dia del historial (plan §3,
 * "Suscripcion en vivo"): si el dia ya esta, la fila entra en su lugar por
 * hora y se recalculan el total y el conteo; si no, se crea el dia en su
 * lugar (arriba, si es el mas reciente).
 *
 * Es una funcion pura para poder probarla sin pantalla, y no duplica: si el
 * movimiento ya estaba (porque llego tambien en una recarga), no hace nada.
 *
 * Devuelve `null` si el movimiento pertenece a un dia mas antiguo que lo
 * cargado y todavia hay lotes por pedir: ese dia llegara completo al bajar, y
 * crearlo ahora lo dejaria a medias.
 */
export function insertarMovimiento(
  dias: DiaHistorial[],
  diaLocal: string,
  movimiento: Movimiento,
  hayMas: boolean,
): { dias: DiaHistorial[]; diaNuevo: boolean } | null {
  if (dias.some((d) => d.movimientos.some((m) => m.id === movimiento.id))) {
    return { dias, diaNuevo: false };
  }

  const cuenta = (tipo: TipoMovimiento) => (tipo === "escaneo" ? 1 : 0);
  const existente = dias.find((d) => d.dia_local === diaLocal);

  if (existente) {
    const movimientos = [...existente.movimientos, movimiento].sort((a, b) =>
      a.ocurrido_en < b.ocurrido_en ? 1 : a.ocurrido_en > b.ocurrido_en ? -1 : 0,
    );
    const actualizado: DiaHistorial = {
      ...existente,
      movimientos,
      total_neto: existente.total_neto + movimiento.beats,
      escaneos: existente.escaneos + cuenta(movimiento.tipo),
    };
    return { dias: dias.map((d) => (d === existente ? actualizado : d)), diaNuevo: false };
  }

  const masAntiguo = dias[dias.length - 1]?.dia_local;
  if (hayMas && masAntiguo && diaLocal < masAntiguo) return null;

  const nuevo: DiaHistorial = {
    dia_local: diaLocal,
    total_neto: movimiento.beats,
    escaneos: cuenta(movimiento.tipo),
    movimientos: [movimiento],
  };
  const siguientes = [...dias, nuevo].sort((a, b) =>
    a.dia_local < b.dia_local ? 1 : a.dia_local > b.dia_local ? -1 : 0,
  );
  return { dias: siguientes, diaNuevo: true };
}
