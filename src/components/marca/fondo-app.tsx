/**
 * El cielo de la marca, como lienzo detras del contenido.
 *
 * Solo va en el onboarding (constitution §2, v2.10.0). La bienvenida y el
 * Inicio usan el degradado de marca en CSS (`.fondo-inicio`) y el resto de la
 * app es crema solido (`--color-fondo`).
 *
 * Son tres capas apiladas:
 *
 * 1. El cielo del branding (fondos/fondo-splash-backdrop.webp, la version
 *    reducida del splash: aqui vive detras de un velo, asi que la resolucion
 *    completa no se llega a ver).
 * 2. Un velo blanco, que baja el contraste del cielo para que el texto navy
 *    siga legible encima.
 * 3. El degradado de marca en `soft-light`, que tiñe el conjunto con el azul y
 *    el amarillo de Latidos sin tapar la textura de abajo.
 *
 * Va en un div fijo y no como `background-attachment: fixed`: en movil el
 * attachment fijo dimensiona el `cover` contra el documento entero y la
 * imagen queda con zoom y descuadrada.
 *
 * Si la imagen no carga, queda el crema y la pantalla sigue legible.
 */
export function FondoApp() {
  return (
    <div aria-hidden="true" data-cielo="pantalla" className="fondo-app">
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
