"use client";

import Link from "next/link";
import { useState } from "react";

import { ContadorBeatsVivo } from "@/components/beats/contador-beats-vivo";
import type { MetricasSemana, ResumenMarca } from "@/lib/beats/dashboard";
import { beatsConSigno, conteoEscaneos } from "@/lib/beats/formato";

/**
 * Piezas del dashboard de Beats (constitution §2, v2.8.0; v2.9.0): la tarjeta
 * de vidrio con el saldo y "Tu pulso", y el carrusel de marcas. Todo sale del historial que ya
 * trae la pantalla; aqui no se pide nada a la red.
 */

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconoReloj() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2.2" {...trazo}>
      <path d="M12 8v4l3 2" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

/**
 * Tarjeta de Beats (constitution §2, v2.9.0): una sola pieza de vidrio con el
 * saldo y "Tu pulso". Arriba "Beats acumulados" y el chip de la semana (la
 * cifra semanal vive solo ahi); el saldo en Anton con su conteo animado; la
 * linea de latido; "Tu pulso · Últimos 7 días" y las tres metricas.
 */
export function TarjetaBeats({
  saldo,
  metricas,
  cargando,
}: {
  saldo: number | null;
  metricas: MetricasSemana;
  cargando: boolean;
}) {
  const datos = [
    { valor: metricas.escaneos, etiqueta: "Escaneos" },
    { valor: metricas.marcas, etiqueta: "Marcas" },
    { valor: metricas.diasActivos, etiqueta: "Días activos" },
  ];
  return (
    <section
      aria-label="Tu balance de Beats"
      data-tarjeta-beats=""
      className="vidrio mt-[22px] flex flex-col gap-[14px] rounded-[30px] px-6 py-[22px]"
    >
      {/* Alto fijo para la fila: el chip llega con el historial y no puede
          empujar el numero. */}
      <div className="flex min-h-[26px] items-center justify-between gap-3">
        <span className="text-[14px] text-texto-secundario">Beats acumulados</span>
        {metricas.beats > 0 ? (
          <span
            data-chip-semana=""
            className="shrink-0 rounded-full bg-primario px-3 py-[5px] text-[12px] font-bold text-texto-principal"
          >
            +{metricas.beats} esta semana
          </span>
        ) : null}
      </div>
      {saldo !== null ? (
        // Sin animacion de entrada (spec §10.11): el numero aparece directo.
        // Solo se anima si cambia con la pantalla abierta.
        <ContadorBeatsVivo valor={saldo} variante="plano" />
      ) : (
        <div className="flex h-[68px] items-center text-texto-secundario">
          {cargando ? <span className="girador" aria-hidden="true" /> : null}
        </div>
      )}
      {/* Decorativa y quieta: es arte de marca, no una grafica de los datos.
          Ancho y alto fijos (la proporcion del archivo, 640 x 218) para que no
          mueva nada al cargar. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ilustraciones/ecg-pulso.webp"
        alt=""
        width={640}
        height={218}
        decoding="async"
        data-ecg-pulso=""
        className="mt-0.5 block h-auto w-full"
      />
      <div data-tu-pulso="">
        <h2 className="text-[12px] font-semibold tracking-[0.02em] text-texto-secundario">
          Tu pulso · Últimos 7 días
        </h2>
        <dl className="mt-[14px] grid grid-cols-3 gap-2 border-t border-texto-principal/10 pt-[14px]">
          {datos.map((d) => (
            <div key={d.etiqueta} className="flex flex-col-reverse">
              <dt className="text-[12px] text-texto-secundario">{d.etiqueta}</dt>
              <dd className="font-display text-[24px] leading-[1.1] text-texto-principal">{d.valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function IconoMarca({ marca }: { marca: ResumenMarca }) {
  const [logoRoto, setLogoRoto] = useState(false);
  if (marca.logo_url && !logoRoto) {
    return (
      // Un <img> y no next/image: los logos los sube el admin y pueden vivir
      // en cualquier dominio (igual que en las filas del historial).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={marca.logo_url}
        alt=""
        aria-hidden="true"
        width={44}
        height={44}
        loading="lazy"
        onError={() => setLogoRoto(true)}
        className="h-11 w-11 rounded-full bg-superficie object-contain"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 items-center justify-center rounded-full bg-secundario/[0.12] text-[17px] font-bold text-texto-principal"
    >
      {marca.nombre.trim().charAt(0).toLocaleUpperCase("es") || "?"}
    </span>
  );
}

/**
 * Carrusel de marcas: una tarjeta por marca donde la persona ha sumado y, al
 * final, la tarjeta punteada que invita a escanear. Desplazamiento horizontal
 * con snap; la lista es enfocable para moverla con las flechas, y el enlace
 * del final se alcanza con Tab.
 */
export function CarruselMarcas({ marcas }: { marcas: ResumenMarca[] }) {
  return (
    <section aria-labelledby="titulo-marcas">
      <div className="mx-1 flex items-baseline justify-between gap-3">
        <h2 id="titulo-marcas" className="font-display text-[22px] uppercase tracking-[0.02em] text-texto-principal">
          Marcas
        </h2>
        <p className="text-[13px] font-semibold text-texto-secundario">Donde has sumado</p>
      </div>
      {/* La key remonta la lista cuando llegan las primeras marcas: si no, el
          snap se quedaba pegado a "Descubre más" (la unica tarjeta mientras
          cargaba el historial) y el carrusel nacia desplazado hasta el final. */}
      <ul
        key={marcas.length > 0 ? "con-marcas" : "sin-marcas"}
        aria-label="Marcas donde has sumado"
        tabIndex={0}
        data-carrusel-marcas=""
        className="-mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-0.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secundario"
      >
        {marcas.map((marca) => (
          <li
            key={marca.nombre}
            data-marca=""
            className="flex w-[150px] shrink-0 snap-start flex-col gap-2.5 rounded-[24px] border border-texto-principal/[0.08] bg-superficie p-3.5"
          >
            <IconoMarca marca={marca} />
            <div>
              <p className="text-[15px] font-bold leading-tight text-texto-principal">{marca.nombre}</p>
              <p className="text-[13px] text-texto-secundario">{conteoEscaneos(marca.escaneos)}</p>
            </div>
            <p className="mt-auto font-display text-[22px] leading-none text-texto-principal">
              {beatsConSigno(marca.beats)}
            </p>
          </li>
        ))}
        <li className="flex w-[150px] shrink-0 snap-start">
          <Link
            href="/escanear"
            data-descubre-mas=""
            className="flex w-full flex-col justify-between gap-2.5 rounded-[24px] border-[1.5px] border-dashed border-texto-principal/[0.22] p-3.5 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secundario"
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-superficie text-texto-secundario"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2.4" {...trazo}>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span>
              <span className="block text-[15px] font-bold text-texto-principal">Descubre más</span>
              <span className="block text-[13px] text-texto-secundario">Escanea una marca</span>
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
