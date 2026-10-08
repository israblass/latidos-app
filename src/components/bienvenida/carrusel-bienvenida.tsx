"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import { PANTALLAS, RESERVA_LOGO, type PiezaArte } from "@/components/bienvenida/pantallas";
import { BotonDeslizar } from "@/components/ui/boton-deslizar";
import { ALTO_LOGO, ANCHO_LOGO, LOGOS, LOGOS_PIE, logoSobreAmarillo } from "@/lib/assets";

/**
 * Bienvenida inmersiva (constitution §2, v2.10.0): un carrusel de cuatro
 * pantallas con scroll-snap, sin librerias ni autoplay. Cada pantalla trae su
 * logo, su arte y su texto; los puntos, los dos botones de deslizar y el pie
 * institucional quedan fijos, fuera del carrusel, para que el swipe no los
 * mueva ni el arrastre de un boton mueva el carrusel.
 *
 * El arte se dibuja sobre un lienzo de 390 x 430 y se escala de forma
 * uniforme en CSS (unidades de contenedor, ver .bienvenida-lienzo): no hay
 * medicion en JavaScript y la primera pintura ya sale a su tamaño.
 */

const reduceMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Posicion y tamaño de una pieza, en unidades del lienzo (--u = 1px de 390).
 *
 * Reserva del logo (v2.10.1, ver RESERVA_LOGO): --arriba-libre es la primera
 * fila libre bajo el logo + su reserva, y --abajo-libre la ultima fila antes
 * de los 8px sobre la etiqueta del titular, ambas medidas desde el borde de
 * arriba del arte (globals.css, .bienvenida-lienzo > img).
 * - Protagonista: su pie queda donde estaba (o 8px sobre la etiqueta, con
 *   hastaEtiqueta) y su alto es el menor entre `escala` x su alto y lo que
 *   cabe entre ese pie y --arriba-libre. Se centra en el mismo eje que antes.
 * - Escena: mismo tamaño; baja hasta --arriba-libre si hiciera falta.
 * Nada de esto se mide en JavaScript: todo es CSS y sale bien en la primera
 * pintura.
 */
function estiloPieza(p: PiezaArte): CSSProperties {
  const u = (n: number) => `calc(${n} * var(--u))`;
  const { ancho: aw, alto: ah } = p.ilustracion;
  const altoNatural = p.alto ?? (p.ancho! * ah) / aw;
  const anchoNatural = p.ancho ?? (p.alto! * aw) / ah;
  const sombra = p.sombra ? `drop-shadow(0 10px 22px rgba(26, 35, 50, ${p.sombra}))` : undefined;

  if (p.rol === "protagonista") {
    const pieNatural = u(p.top + altoNatural);
    const pie = p.hastaEtiqueta ? `min(${pieNatural}, var(--abajo-libre))` : pieNatural;
    const centro =
      p.centro !== undefined
        ? `calc(50% + ${p.centro + anchoNatural / 2} * var(--u))`
        : u((p.izquierda ?? 0) + anchoNatural / 2);
    return {
      ["--pie" as string]: pie,
      ["--alto" as string]: `max(0px, min(${u((p.escala ?? 1) * altoNatural)}, calc(var(--pie) - var(--arriba-libre))))`,
      left: centro,
      top: "calc(var(--pie) - var(--alto))",
      width: "auto",
      height: "var(--alto)",
      transform: "translateX(-50%)",
      opacity: p.opacidad,
      filter: sombra,
    };
  }

  return {
    left: p.centro !== undefined ? `calc(50% + ${p.centro} * var(--u))` : u(p.izquierda ?? 0),
    top: p.rol === "escena" ? `max(${u(p.top)}, var(--arriba-libre))` : u(p.top),
    width: p.ancho !== undefined ? u(p.ancho) : "auto",
    height: p.alto !== undefined ? u(p.alto) : "auto",
    opacity: p.opacidad,
    filter: sombra,
  };
}

function Logo({ sobreAmarillo }: { sobreAmarillo?: boolean }) {
  const logo = sobreAmarillo ? logoSobreAmarillo() : LOGOS.aro;
  return (
    <picture>
      <source srcSet={logo.src} type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.respaldo}
        alt="Latidos UCV"
        width={ANCHO_LOGO}
        height={ALTO_LOGO}
        decoding="async"
        data-logo-bienvenida={sobreAmarillo ? "amarillo" : "oficial"}
        className="bienvenida-logo"
      />
    </picture>
  );
}

export function CarruselBienvenida() {
  const carrusel = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState(0);

  // La pantalla visible: la que ocupa mas de la mitad del carrusel.
  useEffect(() => {
    const raiz = carrusel.current;
    if (!raiz) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setActiva(Number((e.target as HTMLElement).dataset.indice));
        }
      },
      { root: raiz, threshold: 0.6 },
    );
    raiz.querySelectorAll("[data-indice]").forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, []);

  // La pantalla 2 se precarga cuando el navegador esta libre: es la primera
  // a la que se llega al deslizar.
  useEffect(() => {
    const precargar = () => {
      for (const p of PANTALLAS[1].arte) new Image().src = p.ilustracion.src;
    };
    const w = window as Window & { requestIdleCallback?: (f: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(precargar);
    else window.setTimeout(precargar, 1500);
  }, []);

  const ir = useCallback((indice: number) => {
    const raiz = carrusel.current;
    if (!raiz) return;
    const destino = Math.max(0, Math.min(PANTALLAS.length - 1, indice));
    raiz.scrollTo({ left: destino * raiz.clientWidth, behavior: reduceMovimiento() ? "auto" : "smooth" });
  }, []);

  const alTeclear = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      ir(activa + 1);
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      ir(activa - 1);
    }
  };

  return (
    <>
      <div
        ref={carrusel}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Bienvenida a Latidos"
        tabIndex={0}
        onKeyDown={alTeclear}
        data-carrusel-bienvenida=""
        className="bienvenida-carrusel"
        style={{ ["--reserva-logo" as string]: `${RESERVA_LOGO}px` }}
      >
        {PANTALLAS.map((p, i) => {
          const visible = i === activa;
          // Las pantallas que no se ven, fuera del foco y del arbol accesible.
          const oculta = (visible ? {} : { inert: "", "aria-hidden": true }) as object;
          const Titulo = visible ? "h1" : "p";
          return (
            <div
              key={p.titulo}
              {...oculta}
              role="group"
              aria-roledescription="pantalla"
              aria-label={`${i + 1} de ${PANTALLAS.length}`}
              data-indice={i}
              className="bienvenida-pantalla"
            >
              <div aria-hidden="true" className={`bienvenida-campo ${p.campo}`} />
              <div aria-hidden="true" className="bienvenida-arte">
                <div className="bienvenida-lienzo">
                  {p.arte.map((pieza) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={pieza.ilustracion.src}
                      data-rol-arte={pieza.rol}
                      src={pieza.ilustracion.src}
                      alt=""
                      width={pieza.ilustracion.ancho}
                      height={pieza.ilustracion.alto}
                      decoding="async"
                      loading={i === 0 ? "eager" : "lazy"}
                      {...(i === 0 ? { fetchpriority: "high" } : {})}
                      style={estiloPieza(pieza)}
                      className="absolute max-w-none"
                    />
                  ))}
                </div>
              </div>
              {/* Velo crema bajo la hora y la bateria (v2.10.1). */}
              <div aria-hidden="true" data-velo-superior="" className="bienvenida-velo" />
              <Logo sobreAmarillo={p.logoSobreAmarillo} />
              <div className="bienvenida-texto">
                <p className="bienvenida-eyebrow">{p.eyebrow}</p>
                {/* Un solo h1: el de la pantalla visible. Las demas llevan el
                    mismo titular como parrafo. */}
                <Titulo className="bienvenida-titulo">
                  {p.titulo} <b>{p.tituloFuerte}</b>
                </Titulo>
                <p className="bienvenida-sub">{p.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fijo, fuera del carrusel. pointer-events solo en lo que se toca: un
          swipe que empieza en el hueco entre botones sigue moviendo el
          carrusel de atras. */}
      <div className="bienvenida-dock">
        <div className="bienvenida-puntos">
          {PANTALLAS.map((p, i) => (
            <button
              key={p.titulo}
              type="button"
              aria-label={`Ir a la pantalla ${i + 1} de ${PANTALLAS.length}`}
              aria-current={i === activa ? "true" : undefined}
              onClick={() => ir(i)}
              data-punto={i}
              className="bienvenida-punto"
            >
              <span className={i === activa ? "activo" : ""} />
            </button>
          ))}
        </div>
        <BotonDeslizar
          href="/registro/paso-1"
          label="Registrarme"
          variante="vidrio-amarillo"
          ariaLabel="Registrarme. Desliza o toca para activar."
          className="bienvenida-boton"
        />
        <BotonDeslizar
          href="/entrar"
          label="Ya tengo cuenta"
          variante="vidrio-blanco"
          ariaLabel="Ya tengo cuenta. Desliza o toca para activar."
          className="bienvenida-boton bienvenida-boton--secundario"
        />
        <footer className="bienvenida-pie">
          <p className="bienvenida-pie__rotulo">Un programa de</p>
          {/* Orden fijo: Flame a la izquierda, UCV a la derecha. Alturas en
              globals.css (.bienvenida-logo-pie--*). */}
          <div className="bienvenida-pie__logos">
            {(
              [
                ["flame", LOGOS_PIE.flame, "bienvenida-logo-pie bienvenida-logo-pie--flame"],
                ["ucv", LOGOS_PIE.ucv, "bienvenida-logo-pie bienvenida-logo-pie--ucv"],
              ] as const
            ).map(([nombre, logo, clase]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={nombre}
                src={logo.src}
                alt={logo.alt}
                width={logo.ancho}
                height={logo.alto}
                decoding="async"
                // Sin precarga: no compiten con el arte de la pantalla 1.
                loading="lazy"
                data-logo-pie={nombre}
                className={clase}
              />
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}
