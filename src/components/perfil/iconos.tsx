/**
 * Iconos de linea del Perfil (24x24, trazo redondeado). Decorativos: el texto
 * de cada fila ya dice lo que son.
 */
const TRAZOS = {
  birrete: ["M2 9l10-5 10 5-10 5-10-5z", "M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"],
  candado: [
    "M8 11V8a4 4 0 0 1 8 0v3",
    "M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z",
  ],
  historial: ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5", "M12 7v5l3 2"],
  regalo: [
    "M4 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z",
    "M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8",
    "M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5h4zM12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5h-4z",
  ],
  campana: ["M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2z", "M10 21h4"],
  ayuda: [
    "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z",
    "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7",
    "M12 17h.01",
  ],
  documento: ["M6 3h8l4 4v14H6z", "M14 3v4h4M9 12h6M9 16h6"],
  chevron: ["M9 5l7 7-7 7"],
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function IconoPerfil({
  nombre,
  tamano = 22,
  trazo = 2,
}: {
  nombre: NombreIcono;
  tamano?: number;
  trazo?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={trazo}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
