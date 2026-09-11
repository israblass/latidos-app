"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Barra de navegacion inferior: 5 tabs, con "Escanear" destacado al centro
 * (constitution §8).
 *
 * Inicio y Escanear ya existen. Pulso, Beats y Perfil se pintan apagados y sin
 * enlace en vez de omitirse: asi la barra ya tiene su forma definitiva y ningun
 * toque termina en un 404. Cada tab se enciende cuando llegue su fase.
 */

const iconoBase = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const IconoInicio = () => (
  <svg {...iconoBase}>
    <path d="M3 10l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const IconoPulso = () => (
  <svg {...iconoBase}>
    <path d="M3 12h4l2-5 3 10 2-5h7" />
  </svg>
);

const IconoEscanear = () => (
  <svg {...iconoBase} width={24} height={24}>
    <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
    <path d="M4 12h16" />
  </svg>
);

const IconoBeats = () => (
  <svg {...iconoBase}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.5h5M9.5 14.5h5" />
  </svg>
);

const IconoPerfil = () => (
  <svg {...iconoBase}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
);

interface Tab {
  etiqueta: string;
  icono: ReactNode;
  href?: string;
  destacado?: boolean;
}

const TABS: Tab[] = [
  { etiqueta: "Inicio", icono: <IconoInicio />, href: "/inicio" },
  { etiqueta: "Pulso", icono: <IconoPulso /> },
  { etiqueta: "Escanear", icono: <IconoEscanear />, href: "/escanear", destacado: true },
  { etiqueta: "Beats", icono: <IconoBeats /> },
  { etiqueta: "Perfil", icono: <IconoPerfil /> },
];

export function TabBar() {
  const rutaActual = usePathname();

  return (
    <nav
      aria-label="Navegacion principal"
      // Vidrio y no blanco solido: es una barra fija con el contenido pasando
      // por debajo, que es justo donde el desenfoque tiene algo que desenfocar
      // (la card oscura de Beats, el degradado de fondo).
      className="vidrio-medio fixed inset-x-0 bottom-0 z-40 rounded-none pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => {
          const activo = tab.href ? rutaActual.startsWith(tab.href) : false;
          const disponible = Boolean(tab.href);
          const contenido = (
            <>
              <span
                className={
                  tab.destacado
                    ? `flex h-11 w-11 items-center justify-center rounded-full ${
                        // El amarillo de marca no se muestra atenuado: apagado
                        // se veria como un amarillo sucio, no como un tab que
                        // todavia no esta disponible.
                        disponible
                          ? "bg-primario text-texto-principal"
                          : "bg-fondo-alterno text-texto-secundario"
                      }`
                    : ""
                }
              >
                {tab.icono}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-etiqueta">
                {tab.etiqueta}
              </span>
            </>
          );

          const clases = `flex min-h-touch flex-1 flex-col items-center justify-center gap-1 py-2 transition-[color,transform] duration-200 ease-out active:scale-95 ${
            // Tab activo en azul y no en amarillo: sobre la barra blanca el
            // amarillo no alcanza contraste (constitution §2 lo contempla). Los
            // inactivos en gris secundario y no terciario, que se queda en
            // 2.5:1 y vuelve la etiqueta ilegible.
            activo ? "text-secundario-texto" : "text-texto-secundario"
          }`;

          return (
            <li key={tab.etiqueta} className="flex flex-1">
              {tab.href ? (
                <Link
                  href={tab.href}
                  aria-current={activo ? "page" : undefined}
                  className={clases}
                >
                  {contenido}
                </Link>
              ) : (
                // Un boton deshabilitado y no un span: el lector de pantalla lo
                // anuncia como control no disponible, mientras que un span se
                // lee como texto suelto y no da ninguna pista de que va a llegar.
                <button
                  type="button"
                  disabled
                  title="Disponible pronto"
                  className={`${clases} opacity-70`}
                >
                  {contenido}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
