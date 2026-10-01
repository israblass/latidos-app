import { ContenidoSinConexion } from "@/components/marca/contenido-sin-conexion";

/**
 * Pantalla que sirve el service worker cuando no hay señal y la navegacion
 * no se puede resolver contra la red. Su ilustracion esta precacheada, asi
 * que se ve completa aunque no haya red desde que se instalo la app.
 */
export default function SinConexion() {
  return <ContenidoSinConexion />;
}
