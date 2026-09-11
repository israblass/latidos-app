/**
 * Lo que queda de los iconos dibujados a mano del onboarding.
 *
 * Los demas se sustituyeron por los assets de marca. Esta campana sobrevive
 * solo como marcador: falta `iconos/icono-notificacion.webp`, que el encargo
 * asigna a la card de "Avisos del programa" y no venia en el zip. Al recibirlo,
 * este archivo entero se puede borrar.
 */

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconoCampana = () => (
  <svg {...base}>
    <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
    <path d="M13.7 21a2 2 0 01-3.4 0" />
  </svg>
);
