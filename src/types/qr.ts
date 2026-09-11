/**
 * Modelo de datos del escaneo de QR de marca (plan §2).
 */

export const ESTADOS_QR = ["activo", "inactivo"] as const;
export type EstadoQR = (typeof ESTADOS_QR)[number];

/**
 * Se declaran como `type` y no como `interface`: el tipado de Supabase exige
 * que las filas satisfagan `Record<string, unknown>`, algo que las interfaces
 * no cumplen por no tener index signature implicito.
 */
export type Marca = {
  id: string;
  nombre: string;
  logo_url: string | null;
  created_at: string;
};

export type QRMarca = {
  id: string;
  marca_id: string;
  beats_otorgados: number;
  /** null = sin limite de usos. */
  limite_total_escaneos: number | null;
  escaneos_totales_contador: number;
  estado: EstadoQR;
  created_at: string;
  updated_at: string;
};

export type Escaneo = {
  id: string;
  usuario_id: string;
  qr_marca_id: string;
  beats_otorgados: number;
  confirmado_en: string;
  created_at: string;
};

/** Motivos por los que un QR no se puede canjear (contrato del plan §3). */
export const MOTIVOS_INVALIDO = [
  "ya_escaneado_hoy",
  "limite_alcanzado",
  "qr_invalido",
] as const;

export type MotivoInvalido = (typeof MOTIVOS_INVALIDO)[number];

/** Respuesta de POST /api/qr/validar. */
export type ResultadoValidacion =
  | {
      valido: true;
      qr_marca_id: string;
      marca: { nombre: string; logo_url: string | null };
      beats_en_juego: number;
    }
  | { valido: false; motivo: MotivoInvalido };
