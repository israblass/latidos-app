/**
 * Foto de perfil (constitution §2, v2.12.0): todo lo que se hace con la imagen
 * en el telefono antes de subirla. Las funciones puras (validar, recortar,
 * nombrar) se prueban sin navegador en perfil-foto.test.ts; `procesarFoto`
 * usa el DOM (img + canvas).
 */

/** Bucket privado de Supabase Storage (supabase/storage/avatares.sql). */
export const BUCKET_AVATARES = "avatares";
/** Lado del cuadrado que se sube. */
export const LADO_AVATAR = 512;
/** Mas que esto no se intenta ni abrir. */
export const MAXIMO_ENTRADA = 15 * 1024 * 1024;
/** Limite del bucket: el resultado tiene que quedar muy por debajo. */
export const MAXIMO_SALIDA = 1024 * 1024;
/** Vida de la URL firmada con la que se muestra la foto, en segundos. */
export const VIDA_URL_FIRMADA = 60 * 60;

export type ErrorFoto = "no-imagen" | "muy-grande" | "ilegible" | "sin-conexion" | "servidor";

export const MENSAJES_ERROR_FOTO: Record<ErrorFoto, string> = {
  "no-imagen": "Elige una imagen JPG, PNG o WebP.",
  "muy-grande": "Esa imagen pesa más de 15 MB. Elige una más liviana.",
  ilegible: "No pudimos leer esa imagen. Prueba con otra.",
  "sin-conexion": "Sin conexión. Inténtalo de nuevo cuando tengas internet.",
  servidor: "No pudimos guardar tu foto. Inténtalo de nuevo.",
};

export class FallaFoto extends Error {
  constructor(public readonly codigo: ErrorFoto) {
    super(MENSAJES_ERROR_FOTO[codigo]);
  }
}

/** Lo que se puede saber del archivo sin abrirlo. */
export function validarArchivo(archivo: { type: string; size: number }): ErrorFoto | null {
  if (!archivo.type.startsWith("image/")) return "no-imagen";
  if (archivo.size > MAXIMO_ENTRADA) return "muy-grande";
  return null;
}

/** El cuadrado central mas grande que cabe en una imagen de ancho x alto. */
export function recorteCentral(ancho: number, alto: number) {
  const lado = Math.min(ancho, alto);
  return { x: Math.floor((ancho - lado) / 2), y: Math.floor((alto - lado) / 2), lado };
}

/** Extension del archivo segun el formato que salio del canvas. */
export function extensionDe(tipo: string): "webp" | "jpg" | "png" {
  if (tipo === "image/webp") return "webp";
  if (tipo === "image/png") return "png";
  return "jpg";
}

/** "<id>/avatar-<marca de tiempo>.<ext>": la carpeta es la de la persona (RLS). */
export function rutaAvatar(usuarioId: string, tipo: string, ahora: number = Date.now()): string {
  return `${usuarioId}/avatar-${ahora}.${extensionDe(tipo)}`;
}

/** Abre la imagen con un <img>: respeta la orientacion EXIF en iOS Safari y Chrome. */
function abrirImagen(archivo: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  return img
    .decode()
    .then(() => img)
    .finally(() => URL.revokeObjectURL(url));
}

function aBlob(lienzo: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolver) => lienzo.toBlob(resolver, tipo, calidad));
}

/**
 * Recorta el cuadrado central, lo lleva a 512x512 y lo exporta en WebP (.82).
 * Si el navegador no codifica WebP de verdad (Safari viejo devuelve PNG), usa
 * JPEG (.85) sobre fondo blanco. Lanza FallaFoto con el motivo.
 */
export async function procesarFoto(archivo: File): Promise<Blob> {
  const invalido = validarArchivo(archivo);
  if (invalido) throw new FallaFoto(invalido);

  let img: HTMLImageElement;
  try {
    img = await abrirImagen(archivo);
  } catch {
    throw new FallaFoto("ilegible");
  }
  if (!img.naturalWidth || !img.naturalHeight) throw new FallaFoto("ilegible");

  const { x, y, lado } = recorteCentral(img.naturalWidth, img.naturalHeight);
  const lienzo = document.createElement("canvas");
  lienzo.width = LADO_AVATAR;
  lienzo.height = LADO_AVATAR;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new FallaFoto("ilegible");
  // Fondo blanco: un PNG con transparencia no queda negro si sale en JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LADO_AVATAR, LADO_AVATAR);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, x, y, lado, lado, 0, 0, LADO_AVATAR, LADO_AVATAR);

  let blob = await aBlob(lienzo, "image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") blob = await aBlob(lienzo, "image/jpeg", 0.85);
  if (!blob || blob.size > MAXIMO_SALIDA) throw new FallaFoto("ilegible");
  return blob;
}
