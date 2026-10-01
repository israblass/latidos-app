import { IlustracionSinSenal } from "@/components/marca/ilustracion-sin-senal";

/**
 * Lo que dice la app cuando no hay señal. Lo usan la pantalla /sin-conexion
 * (la que sirve el service worker) y la de error cuando el fallo viene de la
 * red caida.
 */
export function ContenidoSinConexion() {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 pb-8 pt-4">
      <IlustracionSinSenal ancho={220} />
      <p className="etiqueta mt-8">Sin conexión</p>
      <h1 className="titulo-pantalla mt-3">Te quedaste sin señal</h1>
      <p className="mt-4 text-texto-secundario">
        Vuelve a intentar cuando tengas internet. Tus Beats siguen guardados.
      </p>
    </main>
  );
}
