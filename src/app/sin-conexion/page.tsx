/**
 * Pantalla que sirve el service worker cuando no hay señal y la navegacion
 * no se puede resolver contra la red.
 */
export default function SinConexion() {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 pb-8 pt-4">
      <p className="etiqueta">Sin conexion</p>
      <h1 className="titulo-pantalla mt-3">Te quedaste sin señal</h1>
      <p className="mt-4 text-texto-secundario">
        Vuelve a intentar cuando tengas internet. Tus Beats siguen guardados.
      </p>
    </main>
  );
}
