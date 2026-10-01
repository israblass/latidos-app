"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

import type { BannerInicio } from "@/types/banner";

/**
 * Carrusel de banners de Inicio.
 *
 * Tarjetas 2:1 que rotan solas cada 5 s cuando hay mas de una. Se deslizan
 * con el dedo, se detienen mientras la persona las toca y no rotan solas con
 * `prefers-reduced-motion`: ahi solo cambian con el dedo o con los puntos.
 *
 * Nunca deja un hueco ni un error a la vista: sin filas, con la lectura
 * fallida o con una imagen que no carga, en su lugar va el banner provisional
 * dibujado aqui mismo, con los colores de Latidos.
 *
 * Los banners no suman Beats ni cuentan nada: son solo un enlace, si lo tienen.
 */

/** Tiempo que se queda cada banner antes de pasar al siguiente. */
export const ROTACION_MS = 5000;

/** Pixeles de arrastre a partir de los cuales el gesto cambia de banner. */
const UMBRAL_DESLIZAR = 40;

/** Lo que se muestra cuando no hay ningun banner que pintar. */
const PROVISIONAL: BannerInicio = {
  id: "provisional",
  titulo: "Tu marca aquí",
  imagen_url: null,
  enlace_url: null,
};

/** Banner dibujado en codigo: amarillo de marca, texto navy y un latido. */
function BannerProvisional() {
  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-primario px-6">
      <svg
        aria-hidden="true"
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-3 h-10 w-full text-secundario opacity-60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M0 24h70l6-10 8 22 8-30 7 18h101" />
      </svg>
      <p className="font-display relative text-[28px] uppercase leading-none text-texto-principal">
        Tu marca aquí
      </p>
      <p className="relative mt-2 text-[15px] font-medium text-texto-principal">
        Anúnciate en Latidos
      </p>
    </div>
  );
}

/**
 * Imagen de un banner, o el provisional si no hay imagen o no carga. El
 * error puede ocurrir antes de que React se hidrate (y entonces `onError` no
 * llega): por eso al montar tambien se mira si la imagen ya fallo.
 */
function ImagenBanner({ banner, prioritaria }: { banner: BannerInicio; prioritaria: boolean }) {
  const [rota, setRota] = useState(false);
  const imagen = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const nodo = imagen.current;
    if (nodo && nodo.complete && nodo.naturalWidth === 0) setRota(true);
  }, []);

  if (!banner.imagen_url || rota) return <BannerProvisional />;

  // Las rutas propias pasan por el optimizador de next/image. Una URL externa
  // va tal cual: el optimizador solo acepta los dominios que conoce.
  const externa = !banner.imagen_url.startsWith("/");
  return (
    <Image
      ref={imagen}
      src={banner.imagen_url}
      alt={banner.titulo}
      width={1200}
      height={600}
      sizes="(max-width: 480px) 100vw, 480px"
      priority={prioritaria}
      unoptimized={externa}
      draggable={false}
      onError={() => setRota(true)}
      className="h-full w-full object-cover"
    />
  );
}

function useSinMovimiento() {
  const [sinMovimiento, setSinMovimiento] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSinMovimiento(consulta.matches);
    const alCambiar = () => setSinMovimiento(consulta.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);
  return sinMovimiento;
}

export function CarruselBanners({ banners }: { banners: BannerInicio[] }) {
  const lista = banners.length ? banners : [PROVISIONAL];
  const total = lista.length;
  const [actual, setActual] = useState(0);
  const [tocando, setTocando] = useState(false);
  // Con el foco dentro (teclado, lector de pantalla) tampoco rota: el banner
  // no se puede ir mientras alguien lo esta leyendo.
  const [conFoco, setConFoco] = useState(false);
  const [arrastre, setArrastre] = useState(0);
  const sinMovimiento = useSinMovimiento();

  const inicioGesto = useRef<{ x: number; y: number; id: number } | null>(null);
  // Si el gesto fue un deslizamiento, el clic que lo cierra no abre el enlace.
  const huboDeslizamiento = useRef(false);

  const irA = useCallback(
    (indice: number) => setActual(((indice % total) + total) % total),
    [total],
  );

  // Rotacion: un temporizador por banner, que se rehace cada vez que cambia el
  // banner a la vista. Asi un cambio a mano reinicia la cuenta de 5 s.
  useEffect(() => {
    if (total < 2 || tocando || conFoco || sinMovimiento) return;
    const temporizador = window.setTimeout(() => irA(actual + 1), ROTACION_MS);
    return () => window.clearTimeout(temporizador);
  }, [actual, total, tocando, conFoco, sinMovimiento, irA]);

  function alPresionar(evento: PointerEvent<HTMLDivElement>) {
    setTocando(true);
    huboDeslizamiento.current = false;
    inicioGesto.current = { x: evento.clientX, y: evento.clientY, id: evento.pointerId };
  }

  function alMover(evento: PointerEvent<HTMLDivElement>) {
    const inicio = inicioGesto.current;
    if (!inicio || inicio.id !== evento.pointerId || total < 2) return;
    const dx = evento.clientX - inicio.x;
    const dy = evento.clientY - inicio.y;
    // Un gesto vertical es scroll de la pantalla, no del carrusel.
    if (!huboDeslizamiento.current && Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) > 8) {
      huboDeslizamiento.current = true;
      setArrastre(dx);
    }
  }

  function alSoltar(evento: PointerEvent<HTMLDivElement>) {
    const inicio = inicioGesto.current;
    inicioGesto.current = null;
    setTocando(false);
    if (!inicio || total < 2) return;
    const dx = evento.clientX - inicio.x;
    setArrastre(0);
    if (huboDeslizamiento.current && Math.abs(dx) >= UMBRAL_DESLIZAR) {
      irA(dx < 0 ? actual + 1 : actual - 1);
    }
  }

  function alCancelar() {
    inicioGesto.current = null;
    setTocando(false);
    setArrastre(0);
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Anuncios"
      className="w-full"
      // Solo el foco de teclado: un toque en un punto tambien enfoca el boton,
      // y eso no deberia detener la rotacion para siempre.
      onFocus={(evento) => {
        if ((evento.target as HTMLElement).matches(":focus-visible")) setConFoco(true);
      }}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setConFoco(false);
      }}
    >
      <div
        className="elevado-bajo relative aspect-[2/1] w-full touch-pan-y select-none overflow-hidden rounded-card"
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alCancelar}
        onPointerLeave={(e) => {
          if (inicioGesto.current) alSoltar(e);
        }}
        onClickCapture={(evento) => {
          if (huboDeslizamiento.current) {
            evento.preventDefault();
            evento.stopPropagation();
            huboDeslizamiento.current = false;
          }
        }}
      >
        <div
          data-carrusel-pista=""
          className={`flex h-full ${
            arrastre || sinMovimiento ? "" : "transition-transform duration-500 ease-out"
          }`}
          style={{ transform: `translateX(calc(${-actual * 100}% + ${arrastre}px))` }}
        >
          {lista.map((banner, indice) => {
            const visible = indice === actual;
            const contenido = (
              <ImagenBanner banner={banner} prioritaria={indice === 0} />
            );
            return (
              <div
                key={banner.id}
                role="group"
                aria-roledescription="anuncio"
                aria-label={`${indice + 1} de ${total}`}
                aria-hidden={!visible}
                data-banner-activo={visible ? "" : undefined}
                className="h-full w-full shrink-0"
              >
                {banner.enlace_url ? (
                  <a
                    href={banner.enlace_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={visible ? 0 : -1}
                    draggable={false}
                    className="block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secundario"
                  >
                    {contenido}
                  </a>
                ) : (
                  contenido
                )}
              </div>
            );
          })}
        </div>
      </div>

      {total > 1 ? (
        <div className="mt-1 flex justify-center">
          {lista.map((banner, indice) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Ver anuncio ${indice + 1} de ${total}`}
              aria-current={indice === actual ? "true" : undefined}
              onClick={() => irA(indice)}
              className="flex h-12 w-12 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-secundario"
            >
              <span
                aria-hidden="true"
                className={`block h-2 rounded-full transition-all ${
                  indice === actual ? "w-5 bg-secundario" : "w-2 bg-texto-terciario"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
