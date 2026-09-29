/**
 * Modelo de datos de Beats: el libro de movimientos y lo que la pantalla de
 * Beats arma a partir de el (plan §2 y §3).
 */

/**
 * Todo lo que suma o resta Beats. Los cuatro ultimos todavia no ocurren: estan
 * para que el historial no cambie de forma cuando lleguen (spec §9 regla 16).
 */
export const TIPOS_MOVIMIENTO = [
  "escaneo",
  "bienvenida",
  "ajuste",
  "regalo",
  "donacion",
  "voluntariado",
  "prediccion",
  "canje",
] as const;

export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

export const esTipoMovimiento = (valor: unknown): valor is TipoMovimiento =>
  typeof valor === "string" && (TIPOS_MOVIMIENTO as readonly string[]).includes(valor);

/**
 * Fila de `movimientos_beats` tal como la guarda la base. Solo se lee: el
 * cliente nunca escribe en el libro (spec §9 regla 3).
 *
 * `type` y no `interface`, por lo mismo que en src/types/qr.ts.
 */
export type MovimientoBeats = {
  id: string;
  usuario_id: string;
  tipo: TipoMovimiento;
  /** Con signo y nunca 0. */
  beats: number;
  ocurrido_en: string;
  /** YYYY-MM-DD en hora de Caracas. */
  dia_local: string;
  /** Solo en los escaneos; nulo en los movimientos de Latidos. */
  marca_id: string | null;
  escaneo_id: string | null;
  created_at: string;
};

/** Un movimiento listo para pintar una fila del historial. */
export type Movimiento = {
  id: string;
  tipo: TipoMovimiento;
  beats: number;
  ocurrido_en: string;
  /** Nombre y logo actuales de la marca; nulo en los movimientos de Latidos. */
  marca: { nombre: string; logo_url: string | null } | null;
};

/** Un dia del acordeon, del movimiento mas reciente al mas antiguo. */
export type DiaHistorial = {
  /** YYYY-MM-DD en hora de Caracas. */
  dia_local: string;
  total_neto: number;
  /** Cuenta solo los escaneos, no la bienvenida ni los regalos. */
  escaneos: number;
  movimientos: Movimiento[];
};

/** Lo minimo para decidir que mostrar al abrir la pantalla de Beats. */
export type ResumenBeats = {
  saldo: number;
  tiene_escaneos: boolean;
  onboarding_visto: boolean;
};

/**
 * Copia local de la pantalla de Beats, por usuario, para abrir sin señal
 * (plan §2, CacheBeats). No va en la base.
 */
export type CacheBeats = ResumenBeats & {
  usuario_id: string;
  dias: DiaHistorial[];
  hay_mas: boolean;
  /** Dia desde el que pedir el siguiente lote, o nulo si no hay mas. */
  siguiente_cursor: string | null;
  actualizado_en: string;
};
