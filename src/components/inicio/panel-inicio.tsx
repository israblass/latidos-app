"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

import { FilaMovimiento } from "@/components/beats/fila-movimiento";
import { CarruselBanners } from "@/components/inicio/carrusel-banners";
import { HojaNotificaciones, IconoCampana } from "@/components/inicio/hoja-notificaciones";
import { QueEsLatidos } from "@/components/inicio/que-es-latidos";
import { SaldoInicio } from "@/components/inicio/saldo-inicio";
import { Acordeon } from "@/components/ui/acordeon";
import { CirculoFlecha } from "@/components/ui/circulo-flecha";
import { useActividadReciente } from "@/hooks/use-actividad-reciente";
import { beatsDeLaSemana, movimientosRecientes } from "@/lib/beats/actividad";
import { ILUSTRACIONES } from "@/lib/ilustraciones";
import type { BannerInicio } from "@/types/banner";

/**
 * Inicio (constitution §2, v2.7.0), de arriba a abajo: pildoras (campana y
 * avatar), saludo, tarjeta de Beats en vidrio, Escanear QR, banners y los
 * acordeones de actividad y de "Qué es Latidos".
 *
 * Es de cliente porque la campana abre una hoja y porque los
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

/** Pildoras de la cabecera: 108 x 58. */
const PILDORA =
  "flex h-[58px] w-[108px] items-center justify-center overflow-hidden rounded-full outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secundario active:scale-[0.97] motion-reduce:active:scale-100";

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
  const nombreLargo = nombre.trim().length > 10;

  // Estable: la hoja la usa como dependencia de su efecto. Al cerrarse, la
  // propia hoja devuelve el foco a la campana.
  const cerrarHoja = useCallback(() => setHojaAbierta(false), []);

  return (
    <>
      <header className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Notificaciones"
          aria-haspopup="dialog"
          onClick={() => setHojaAbierta(true)}
          className={`${PILDORA} bg-texto-principal text-texto-inverso`}
        >
          <IconoCampana tamano={24} />
        </button>
        {/* Avatar de marca. Elegir otro llega con el Perfil completo; por
            ahora es el mismo para todos y no se guarda. */}
        <Link
          href="/perfil"
          aria-label="Mi perfil"
          data-pildora-perfil=""
          className={`${PILDORA} border border-white/90 bg-white/85 shadow-[0_6px_18px_rgba(26,35,50,0.08)]`}
        >
          <Image
            src={ILUSTRACIONES.corazonAudifonos.src}
            alt=""
            width={40}
            height={46}
            priority
            className="h-[46px] w-auto"
          />
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

      <HojaNotificaciones abierta={hojaAbierta} alCerrar={cerrarHoja} />
    </>
  );
}
