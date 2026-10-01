import { IlustracionSinSenal } from "@/components/marca/ilustracion-sin-senal";

/**
 * Sin red y sin nada guardado (T042; spec §8.3): la pantalla completa de sin
 * conexion, con su ilustracion. Cuando vuelve la señal, la pantalla de Beats
 * se carga sola.
 */
export function SinConexionBeats() {
  return (
    <section
      aria-label="Sin conexión"
      className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center"
    >
      {/* La misma del service worker: precacheada, se ve sin red. */}
      <IlustracionSinSenal ancho={220} />
      <p className="mt-6 max-w-[18rem] text-texto-principal">
        Necesitas conexión para ver tus Beats por primera vez. Vuelve a intentarlo cuando
        tengas señal.
      </p>
    </section>
  );
}
