import { PantallaEscaneo } from "@/components/escaneo/pantalla-escaneo";
import { PARAMETRO_QR } from "@/lib/qr/contenido";
import { exigirPerfil } from "@/lib/usuario/sesion";

/**
 * Pantalla de escaneo (T039).
 *
 * Exige sesion: solo un usuario registrado puede escanear (spec §9 regla 11).
 * Acepta `?qr=<id>` para cuando el codigo impreso es una URL y la camara nativa
 * del telefono abre la app directamente con el codigo ya leido.
 */
export default async function Escanear({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await exigirPerfil();

  const parametro = searchParams[PARAMETRO_QR];
  const contenidoInicial = Array.isArray(parametro) ? parametro[0] : parametro;

  return <PantallaEscaneo contenidoInicial={contenidoInicial} />;
}
