"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Menu inferior: una pildora flotante de vidrio (constitution §2, v2.4.0).
 *
 * Mismas cinco pestañas y rutas de siempre. Inicio, Escanear, Beats y Perfil
 * ya existen; Pulso se pinta apagado y sin enlace en vez de omitirse, para que
 * la barra tenga su forma definitiva y ningun toque termine en un 404.
 *
 * La pestaña activa se resalta con una pildora amarilla con icono y etiqueta
 * en navy. Esa pildora se desliza de la pestaña anterior a la nueva: cada
 * pantalla monta su propia barra, asi que la posicion de la anterior se guarda
 * en el modulo y la nueva barra arranca desde ahi.
 *
 * El vidrio sale de la clase central `.vidrio-barra` (globals.css): aqui no se
 * define ningun desenfoque propio.
 */

type NombreIcono = "inicio" | "pulso" | "escanear" | "beats" | "perfil";

interface Tab {
  etiqueta: string;
  icono: NombreIcono;
  href?: string;
  /**
   * Hueco para un aviso sobre la pestaña (un punto o un contador). Previsto
   * pero sin uso todavia: ninguna pestaña lo lleva.
   */
  insignia?: number | true;
}

const TABS: Tab[] = [
  { etiqueta: "Inicio", icono: "inicio", href: "/inicio" },
  { etiqueta: "Pulso", icono: "pulso" },
  { etiqueta: "Escanear", icono: "escanear", href: "/escanear" },
  { etiqueta: "Beats", icono: "beats", href: "/beats" },
  { etiqueta: "Perfil", icono: "perfil", href: "/perfil" },
];

/**
 * Los iconos de siempre (casa, corazon con latido, marco de escaneo, rayo,
 * persona), redibujados en SVG con trazo de 1.75 para poder pintarlos con el
 * color de cada estado: contorno en las inactivas y relleno en la activa.
 */
function Icono({ nombre, relleno }: { nombre: NombreIcono; relleno: boolean }) {
  const comun = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const lleno = relleno ? "currentColor" : "none";
  const trazos: Record<NombreIcono, ReactNode> = {
    inicio: <path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5z" fill={lleno} />,
    pulso: (
      <>
        <path
          d="M12 20.5s-8.5-5.2-8.5-11.1A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.8c0 5.9-8.5 11.1-8.5 11.1z"
          fill={lleno}
        />
        <path d="M5.5 12.5h3l1.5-2.5 2 5 1.5-3h5" stroke={relleno ? "var(--color-fondo)" : "currentColor"} />
      </>
    ),
    escanear: (
      <>
        <path d="M4 8.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3" />
        {relleno ? <rect x="8" y="8" width="8" height="8" rx="1.5" fill="currentColor" stroke="none" /> : <path d="M8 12h8" />}
      </>
    ),
    beats: <path d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6z" fill={lleno} />,
    perfil: (
      <>
        <circle cx="12" cy="8" r="4" fill={lleno} />
        <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0z" fill={lleno} />
      </>
    ),
  };
  return <svg {...comun}>{trazos[nombre]}</svg>;
}

/** Punto o contador sobre el icono. Hoy no se muestra en ninguna pestaña. */
function Insignia({ valor }: { valor: number | true }) {
  return (
    <span
      data-insignia=""
      className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-texto-inverso"
    >
      {valor === true ? null : valor}
    </span>
  );
}

/**
 * Pestaña activa de la barra anterior. Sobrevive a la navegacion entre
 * pantallas (es estado del modulo, no del componente) y es lo que permite que
 * la pildora se deslice desde donde estaba.
 */
let indiceAnterior: number | null = null;

export function TabBar() {
  const rutaActual = usePathname();
  const indiceActivo = TABS.findIndex((tab) => tab.href && rutaActual.startsWith(tab.href));

  const [indicePildora, setIndicePildora] = useState(() =>
    indiceAnterior !== null && indiceActivo >= 0 ? indiceAnterior : indiceActivo,
  );

  useEffect(() => {
    indiceAnterior = indiceActivo;
    // Dos cuadros: el primero pinta la pildora en la pestaña anterior, el
    // segundo la mueve, y la transicion hace el resto.
    let cuadro = requestAnimationFrame(() => {
      cuadro = requestAnimationFrame(() => setIndicePildora(indiceActivo));
    });
    return () => cancelAnimationFrame(cuadro);
  }, [indiceActivo]);

  return (
    <nav
      aria-label="Principal"
      className="vidrio-barra fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+var(--margen-barra))] z-40 mx-auto h-[var(--alto-barra)] max-w-[480px]"
    >
      {/* Fuera de la lista: es decoracion, no una pestaña. */}
      {indicePildora >= 0 ? (
        <span
          aria-hidden="true"
          data-pildora-activa=""
          className="pointer-events-none absolute inset-y-1.5 left-1.5 rounded-full bg-primario shadow-[0_2px_8px_rgba(26,35,50,0.12)] transition-transform duration-[250ms] ease-out motion-reduce:transition-none"
          style={{
            width: `calc((100% - 0.75rem) / ${TABS.length})`,
            transform: `translateX(${indicePildora * 100}%)`,
          }}
        />
      ) : null}

      <ul className="relative flex h-full items-stretch px-1.5 py-1.5">
        {TABS.map((tab, indice) => {
          const activo = indice === indiceActivo;
          const contenido = (
            <>
              <span className="relative">
                <Icono nombre={tab.icono} relleno={activo} />
                {tab.insignia !== undefined ? <Insignia valor={tab.insignia} /> : null}
              </span>
              <span className={`text-[11px] leading-none ${activo ? "font-bold" : "font-medium"}`}>
                {tab.etiqueta}
              </span>
            </>
          );

          const clases = `relative flex min-h-touch w-full flex-col items-center justify-center gap-1 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto-principal ${
            activo ? "text-texto-principal" : "text-texto-secundario"
          }`;

          return (
            <li key={tab.etiqueta} className="relative flex flex-1">
              {tab.href ? (
                <Link
                  href={tab.href}
                  aria-current={activo ? "page" : undefined}
                  className={`${clases} active:scale-95`}
                >
                  {contenido}
                </Link>
              ) : (
                <button type="button" disabled title="Disponible pronto" className={`${clases} opacity-70`}>
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
