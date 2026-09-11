/**
 * Configuracion global de la app (plan §2, ConfiguracionApp).
 *
 * Es un singleton: una sola fila, garantizada por la base. Solo el admin la
 * cambia desde backoffice (spec §9 regla 13).
 */
export type ConfiguracionApp = {
  id: string;
  /**
   * Con el modo evento encendido, el cierre de un canje invita a seguir
   * escaneando, porque tiene sentido que haya mas stands cerca. Apagado, el
   * cierre es simple (spec §9 regla 12).
   */
  modo_evento_activo: boolean;
  updated_at: string;
};

/** Motivos por los que un canje no se completa. */
export const MOTIVOS_CANJE_FALLIDO = [
  "ya_escaneado_hoy",
  "limite_alcanzado",
  "qr_invalido",
  "sesion_invalida",
] as const;

export type MotivoCanjeFallido = (typeof MOTIVOS_CANJE_FALLIDO)[number];

/** Respuesta de POST /api/qr/confirmar-canje (contrato del plan §3). */
export type ResultadoCanje =
  | {
      ok: true;
      beats_otorgados: number;
      beats_balance_actualizado: number;
      modo_evento_activo: boolean;
    }
  | { ok: false; motivo: MotivoCanjeFallido };
