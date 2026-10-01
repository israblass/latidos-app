/**
 * El circulo con flecha de los botones `.boton--flecha` (constitution §2,
 * v2.6.0). Sus colores salen del boton que lo contiene (globals.css): navy con
 * flecha amarilla en el primario, amarillo con flecha navy en el oscuro.
 *
 * 48px en el CTA grande (64 de alto) y 32px en los botones bajos.
 */
export function CirculoFlecha({ tamano = 48 }: { tamano?: 32 | 40 | 48 }) {
  const flecha = tamano >= 48 ? 22 : 18;
  return (
    <span aria-hidden="true" className="circulo-flecha" style={{ width: tamano, height: tamano }}>
      <svg
        aria-hidden="true"
        width={flecha}
        height={flecha}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </span>
  );
}
