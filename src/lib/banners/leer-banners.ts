import { crearClienteServidor } from "@/lib/supabase/server";
import type { BannerInicio } from "@/types/banner";

/**
 * Banners activos de Inicio, en su orden. La politica de la tabla ya deja ver
 * solo los activos; el filtro se repite para no depender de ella al leer.
 *
 * Nunca lanza: si la lectura falla, Inicio se pinta igual y el carrusel pone
 * su banner provisional. Un anuncio no puede tumbar la pantalla principal.
 */
export async function leerBannersActivos(): Promise<BannerInicio[]> {
  try {
    const supabase = crearClienteServidor();
    const { data, error } = await supabase
      .from("banners")
      .select("id, titulo, imagen_url, enlace_url")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
