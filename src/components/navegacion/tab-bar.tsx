"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Barra de navegacion inferior: 5 tabs, con "Escanear" destacado al centro
 * (constitution §8).
 *
 * Inicio y Escanear ya existen. Pulso, Beats y Perfil se pintan apagados y sin
 * enlace en vez de omitirse: asi la barra ya tiene su forma definitiva y ningun
 * toque termina en un 404. Cada tab se enciende cuando llegue su fase.
 */

/** Lado del icono en pantalla. Next pide las variantes por DPR a partir de aqui. */
const LADO_ICONO = 26;

interface Tab {
  etiqueta: string;
  /** Base del nombre de archivo en /assets/tabs. */
  icono: string;
  href?: string;
  destacado?: boolean;
}

const TABS: Tab[] = [
  { etiqueta: "Inicio", icono: "inicio", href: "/inicio" },
  { etiqueta: "Pulso", icono: "pulso" },
  { etiqueta: "Escanear", icono: "escanear", href: "/escanear", destacado: true },
  { etiqueta: "Beats", icono: "beats" },
  { etiqueta: "Perfil", icono: "perfil" },
];

/**
 * Los dos estados del icono, uno encima del otro.
 *
 * Se pintan siempre los dos y se cruza la opacidad, en vez de cambiar el `src`
 * al seleccionar: cambiar el src obliga a descargar la otra variante en ese
 * momento y el icono parpadea la primera vez que se toca cada tab. Asi ambos
 * llegan con la pantalla y el cambio ademas puede transicionar.
 */
function IconoTab({ base, activo }: { base: string; activo: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative block"
      style={{ width: LADO_ICONO, height: LADO_ICONO }}
    >
      {(["inactivo", "activo"] as const).map((estado) => (
        <Image
          key={estado}
          src={`/assets/tabs/icono-tab-${base}-${estado}.webp`}
          alt=""
          width={LADO_ICONO}
          height={LADO_ICONO}
          priority
          className={`absolute inset-0 transition-opacity duration-200 ease-out ${
            (estado === "activo") === activo ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </span>
  );
}

export function TabBar() {
  const rutaActual = usePathname();

  return (
    <nav
      aria-label="Navegacion principal"
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
                    ? `flex h-11 w-11 items-center justify-center rounded-full transition-[colors,transform,box-shadow] duration-200 ${
                        // Se eleva el circulo, no la barra: la barra es vidrio
                        // esmerilado, y una sombra marcada debajo se ve a traves
                        // y lo ensucia. El circulo si es una pieza solida que
                        // puede flotar sobre ella.
                        disponible ? "elevado-bajo" : ""
                      } ${
                        // El amarillo de marca no se muestra atenuado: apagado
                        // se veria como un amarillo sucio, no como un tab que
                        // todavia no esta disponible.
                        disponible ? "bg-primario" : "bg-fondo-alterno"
                      }`
                    : ""
                }
              >
                {/*
                  El destacado se queda siempre con el icono navy. El activo de
                  la serie es relleno azul, y azul sobre el amarillo de marca no
                  alcanza contraste; navy sobre amarillo si es la combinacion
                  aprobada. Que este seleccionado se lee por la etiqueta y por
                  el circulo, que solo lleva este tab.
                */}
                <IconoTab base={tab.icono} activo={tab.destacado ? false : activo} />
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
