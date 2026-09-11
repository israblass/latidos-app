import { ASSETS } from "@/lib/assets";

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
 * 1. El cielo del branding, la misma imagen que usa la web.
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
      <div
        className="fondo-app__cielo"
        style={{ backgroundImage: `url(${ASSETS.fondoCielo})` }}
      />
      <div className="fondo-app__velo" />
      <div
        className="fondo-app__tinte"
        style={{ backgroundImage: "url(/fondo-latidos.jpg)" }}
      />
    </div>
  );
}
