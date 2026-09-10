/** Iconos de linea para los bloques del onboarding. Trazo de 2, 20x20. */

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

export const IconoQR = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" />
  </svg>
);

export const IconoCaja = () => (
  <svg {...base}>
    <path d="M3 8l9-5 9 5v8l-9 5-9-5z" />
    <path d="M3 8l9 5 9-5M12 13v8" />
  </svg>
);

export const IconoManos = () => (
  <svg {...base}>
    <path d="M12 20s-7-4.5-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.5-7 9-7 9z" />
  </svg>
);

export const IconoCalendario = () => (
  <svg {...base}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 11h18" />
  </svg>
);

export const IconoEntrada = () => (
  <svg {...base}>
    <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2 2 2 0 000 4 2 2 0 000 4 2 2 0 01-2 2H5a2 2 0 01-2-2 2 2 0 000-4 2 2 0 000-4z" />
    <path d="M13 6v2M13 11v2M13 16v2" />
  </svg>
);

export const IconoBolso = () => (
  <svg {...base}>
    <path d="M6 7h12l1 13H5z" />
    <path d="M9 7V5a3 3 0 016 0v2" />
  </svg>
);

export const IconoLibro = () => (
  <svg {...base}>
    <path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4z" />
    <path d="M20 4h-2a3 3 0 00-3 3v13a2 2 0 012-2h3z" />
  </svg>
);

export const IconoCampana = () => (
  <svg {...base}>
    <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
    <path d="M13.7 21a2 2 0 01-3.4 0" />
  </svg>
);
