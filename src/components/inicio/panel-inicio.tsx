"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { FilaMovimiento } from "@/components/beats/fila-movimiento";
import { HojaComoGanar } from "@/components/beats/hoja-como-ganar";
import { CarruselBanners } from "@/components/inicio/carrusel-banners";
import { QueEsLatidos } from "@/components/inicio/que-es-latidos";
import { SaldoInicio } from "@/components/inicio/saldo-inicio";
import { Acordeon } from "@/components/ui/acordeon";
import { CirculoFlecha } from "@/components/ui/circulo-flecha";
import { useActividadReciente } from "@/hooks/use-actividad-reciente";
import { beatsDeLaSemana, movimientosRecientes } from "@/lib/beats/actividad";
import type { BannerInicio } from "@/types/banner";

/**
 * Inicio (constitution §2, v2.6.0), de arriba a abajo: pildoras, saludo,
 * tarjeta de Beats, Escanear QR, banners y los acordeones de actividad y de
 * "Qué es Latidos".
 *
 * Es de cliente porque la pildora de ayuda abre una hoja y porque los
 * movimientos recientes (que alimentan el chip de la semana y la actividad) se
 * leen con la sesion de la persona, al montar y al volver a la app.
 */

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconoAyuda() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" {...trazo}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.8M12 17h.01" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2.2" {...trazo}>
      <path d="M12 8v4l3 2" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function IconoCorazon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2.2" {...trazo}>
      <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" />
    </svg>
  );
}

/** Pildora navy de la cabecera: 108 x 58. */
const PILDORA =
  "flex h-[58px] w-[108px] items-center justify-center rounded-full bg-texto-principal text-texto-inverso outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secundario active:scale-[0.97] motion-reduce:active:scale-100";

export function PanelInicio({
  nombre,
  usuarioId,
  saldoInicial,
  banners,
}: {
  nombre: string;
  usuarioId: string;
  saldoInicial: number;
  banners: BannerInicio[];
}) {
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const dias = useActividadReciente(usuarioId);
  const recientes = dias ? movimientosRecientes(dias, 3) : [];
  const semana = dias ? beatsDeLaSemana(dias) : null;
  const inicial = nombre.trim().charAt(0).toLocaleUpperCase("es") || "?";
  const nombreLargo = nombre.trim().length > 10;

  // Estable: la hoja la usa como dependencia de su efecto. Al cerrarse, la
  // propia hoja devuelve el foco a la pildora que la abrio.
  const cerrarHoja = useCallback(() => setHojaAbierta(false), []);

  return (
    <>
      <header className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Cómo gano Beats"
          aria-haspopup="dialog"
          onClick={() => setHojaAbierta(true)}
          className={PILDORA}
        >
          <IconoAyuda />
        </button>
        <Link href="/perfil" aria-label="Mi perfil" className={PILDORA}>
          <span
            aria-hidden="true"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-primario text-[16px] font-bold text-texto-principal"
          >
            {inicial}
          </span>
        </Link>
      </header>

      {/* El h1 sigue siendo solo para lector de pantalla: el saludo no es el
          titulo de la pantalla. */}
      <h1 className="sr-only">Inicio</h1>
      <p
        data-saludo=""
        className={`mx-1 mt-[22px] break-words font-light leading-[1.1] tracking-[-0.01em] text-texto-principal ${
          nombreLargo ? "text-[32px]" : "text-[40px]"
        }`}
      >
        Hola,
        <b className="block font-bold">{nombre}!</b>
      </p>

      <section aria-label="Tu balance de Beats" className="mt-6">
        {/* Se relee al volver a la app (desbloqueo, segundo plano, red). */}
        <SaldoInicio saldoInicial={saldoInicial} beatsSemana={semana} />
      </section>

      <Link
        href="/escanear"
        className="boton-primario boton--flecha mt-[14px] h-16 text-[17px] font-bold"
        style={{ paddingLeft: 28, paddingRight: 8 }}
      >
        Escanear QR
        <CirculoFlecha tamano={48} />
      </Link>

      <div className="mt-4">
        <CarruselBanners banners={banners} />
      </div>

      <div className="mt-4 overflow-hidden rounded-[28px] border border-texto-principal/[0.08] bg-superficie">
        <Acordeon
          titulo="Actividad reciente"
          subtitulo="Lo último que sumaste"
          icono={<IconoReloj />}
          abiertoAlInicio
        >
          {dias === null ? (
            // Mientras carga: el alto de una fila, sin girador a la vista.
            <div aria-hidden="true" className="h-12" />
          ) : recientes.length ? (
            <ul aria-label="Movimientos recientes" className="divide-y divide-texto-principal/[0.08]">
              {recientes.map((m) => (
                <FilaMovimiento key={m.id} movimiento={m} />
              ))}
            </ul>
          ) : (
            <p className="py-2 text-[14px] text-texto-secundario">Aún no hay movimientos</p>
          )}
          <Link href="/beats" className="boton-oscuro boton--flecha mt-1.5 min-h-12 h-12 text-[15px] font-bold">
            Ver historial
            <CirculoFlecha tamano={32} />
          </Link>
        </Acordeon>

        <Acordeon titulo="Qué es Latidos" subtitulo="El programa y sus 3 fases" icono={<IconoCorazon />}>
          <QueEsLatidos />
        </Acordeon>
      </div>

      <HojaComoGanar abierta={hojaAbierta} alCerrar={cerrarHoja} />
    </>
  );
}
