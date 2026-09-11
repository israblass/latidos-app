/**
 * Lectura del contenido de un QR de marca.
 *
 * Lo que viaja en el codigo es el id del registro de `qr_marca` (plan §2). Se
 * aceptan dos formas:
 *
 * - El UUID pelado.
 * - Una URL de la app que lo lleve, como
 *   `https://latidos.app/escanear?qr=<uuid>`.
 *
 * La forma de URL existe porque la camara nativa del telefono tambien la
 * reconoce y abre la app directo, sin que la persona tenga que entrar primero.
 * Un QR con el UUID pelado no le dice nada a la camara del sistema.
 *
 * Los Beats nunca van en el codigo: se resuelven en el servidor al escanear,
 * para que el admin los pueda cambiar sin reimprimir nada (constitution §6).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nombre del parametro que lleva el id cuando el QR es una URL. */
export const PARAMETRO_QR = "qr";

/** Devuelve el id del QR, o null si el contenido no es de Latidos. */
export function leerIdDeQR(contenido: string): string | null {
  const limpio = contenido.trim();
  if (!limpio) return null;

  if (UUID.test(limpio)) return limpio.toLowerCase();

  let url: URL;
  try {
    url = new URL(limpio);
  } catch {
    return null;
  }

  const enParametro = url.searchParams.get(PARAMETRO_QR);
  if (enParametro && UUID.test(enParametro)) return enParametro.toLowerCase();

  // Tambien vale la forma /escanear/<uuid>, por si se imprime asi.
  const ultimoSegmento = url.pathname.split("/").filter(Boolean).pop() ?? "";
  if (UUID.test(ultimoSegmento)) return ultimoSegmento.toLowerCase();

  return null;
}

/** URL que conviene meter en el QR impreso de un codigo. */
export function urlDeQR(idQR: string, origen: string): string {
  return `${origen.replace(/\/$/, "")}/escanear?${PARAMETRO_QR}=${idQR}`;
}
