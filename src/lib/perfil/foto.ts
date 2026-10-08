"use client";

import { olvidarUrlFirmada } from "@/hooks/use-url-firmada";
import { BUCKET_AVATARES, FallaFoto, rutaAvatar } from "@/lib/avatar";
import { crearClienteNavegador } from "@/lib/supabase/client";

/** Sin red no se intenta nada: se dice de una vez. */
function exigirConexion() {
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new FallaFoto("sin-conexion");
}

/** Una falla de red a mitad de camino tambien es "sin conexion". */
const fallaDeRed = () => new FallaFoto(navigator.onLine ? "servidor" : "sin-conexion");

/**
 * Sube la foto ya procesada con la sesion de la persona, apunta `avatar_path`
 * a ella y, SOLO si las dos cosas salieron bien, borra la anterior. Si el
 * borrado falla queda un archivo huerfano en su carpeta privada: no es un
 * error para quien usa la app. Devuelve la ruta nueva.
 */
export async function guardarFoto(opciones: {
  usuarioId: string;
  foto: Blob;
  rutaAnterior: string | null;
}): Promise<string> {
  exigirConexion();
  const supabase = crearClienteNavegador();
  const bucket = supabase.storage.from(BUCKET_AVATARES);
  const ruta = rutaAvatar(opciones.usuarioId, opciones.foto.type);

  const subida = await bucket.upload(ruta, opciones.foto, {
    contentType: opciones.foto.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (subida.error) throw fallaDeRed();

  const { error } = await supabase
    .from("usuarios")
    .update({ avatar_path: ruta })
    .eq("id", opciones.usuarioId);
  if (error) {
    // El perfil sigue apuntando a la foto anterior: la nueva sobra.
    await bucket.remove([ruta]);
    throw fallaDeRed();
  }

  if (opciones.rutaAnterior && opciones.rutaAnterior !== ruta) {
    // La URL firmada de la foto anterior apunta a un archivo que se borra.
    olvidarUrlFirmada(opciones.rutaAnterior);
    await bucket.remove([opciones.rutaAnterior]);
  }
  return ruta;
}

/** "Quitar foto": el perfil vuelve a las iniciales y el archivo se borra. */
export async function quitarFoto(opciones: { usuarioId: string; ruta: string }): Promise<void> {
  exigirConexion();
  const supabase = crearClienteNavegador();
  const { error } = await supabase
    .from("usuarios")
    .update({ avatar_path: null })
    .eq("id", opciones.usuarioId);
  if (error) throw fallaDeRed();
  olvidarUrlFirmada(opciones.ruta);
  await supabase.storage.from(BUCKET_AVATARES).remove([opciones.ruta]);
}
