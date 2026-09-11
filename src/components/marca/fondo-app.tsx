/**
 * Lienzo de la app: la capa que hace posible el vidrio esmerilado.
 *
 * `backdrop-filter` difumina lo que tiene detras. Sobre un color plano no hay
 * nada que difuminar y el resultado devuelve el mismo color: las cards se ven
 * como rectangulos grises, no como vidrio. Esta capa pone detras una imagen con
 * variacion real de luminancia, que es el material que el desenfoque necesita.
 *
 * Son tres capas apiladas:
 *
 * 1. El cielo del branding (fondos/fondo-splash.webp).
 * 2. Un velo blanco, que baja el contraste del cielo para que el texto navy
 *    siga legible encima, pero deja pasar suficiente variacion.
 * 3. El degradado de marca en `soft-light`, que tiñe el conjunto con el azul y
 *    el amarillo de Latidos sin tapar la textura de abajo.
 *
 * Va en un div fijo y no como `background-attachment: fixed` del body: en
 * movil el attachment fijo dimensiona el `cover` contra el documento entero,
 * no contra la ventana, y la imagen queda con zoom y descuadrada. Es el mismo
 * problema que la web ya documento en su globals.css.
 *
 * Al ser fijo, el contenido scrollea por encima y el cielo se queda quieto: por
 * eso las nubes parecen moverse despacio detras del vidrio.
 */
export function FondoApp() {
  return (
    <div aria-hidden="true" className="fondo-app">
      {/* El cielo. Si no carga, debajo queda el blanco del body y la app sigue
          perfectamente legible: el vidrio se vera plano, nada mas. */}
      {/*
        Version reducida del splash. El original es 1920x3428 y pesa 467 KB;
        aqui vive detras de un velo al 0.72 y de un desenfoque de 32px, asi que
        esa resolucion no se puede ver. La copia de 600px pesa 24 KB y se
        carga en todas las pantallas: la diferencia importa mas que el detalle
        que nadie llega a mirar. El original se conserva para el splash
        screen, donde si se ve a tamaño completo.
      */}
      <div
        className="fondo-app__cielo"
        style={{ backgroundImage: "url(/assets/fondos/fondo-splash-backdrop.webp)" }}
      />
      <div className="fondo-app__velo" />
      <div
        className="fondo-app__tinte"
        style={{ backgroundImage: "url(/fondo-latidos.jpg)" }}
      />
    </div>
  );
}
