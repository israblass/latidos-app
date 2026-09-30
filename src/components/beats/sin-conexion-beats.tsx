import Image from "next/image";

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
      {/* `unoptimized`: la imagen se pide por su ruta tal cual, que es la que
          el service worker guarda junto a la copia de /beats. Una variante de
          next/image nunca se habria pedido con red, porque esta pantalla solo
          aparece sin ella. */}
      <Image
        src="/assets/estados-vacios/vacio-sin-conexion.webp"
        alt=""
        aria-hidden="true"
        width={180}
        height={180}
        unoptimized
        priority
      />
      <p className="mt-6 max-w-[18rem] text-texto-principal">
        Necesitas conexión para ver tus Beats por primera vez. Vuelve a intentarlo cuando
        tengas señal.
      </p>
    </section>
  );
}
