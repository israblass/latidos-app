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
import { Avatar } from "@/components/ui/avatar";
import { BotonDeslizar } from "@/components/ui/boton-deslizar";
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
const PILDORA_BASE =
  "flex h-[58px] w-[108px] items-center justify-center overflow-hidden rounded-full outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secundario";
const PILDORA = `${PILDORA_BASE} active:scale-[0.97] motion-reduce:active:scale-100`;

export function PanelInicio({
  nombre,
  usuarioId,
  saldoInicial,
  banners,
  avatarPath = null,
}: {
  nombre: string;
  usuarioId: string;
  saldoInicial: number;
  banners: BannerInicio[];
  /** Ruta de la foto de perfil en el bucket privado; null sin foto. */
  avatarPath?: string | null;
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
        {/* Avatar (v2.14.0): la foto de perfil en un circulo de 46px, del alto
            del corazon; sin foto, mientras carga o si falla, el corazon con
            audifonos de siempre. Lleva a Perfil. */}
        <Link
          href="/perfil"
          aria-label="Ir a tu perfil"
          data-pildora-perfil=""
          className={`${PILDORA_BASE} border border-white/90 bg-white/85 shadow-[0_6px_18px_rgba(26,35,50,0.08)] transition-transform active:scale-[0.96] motion-reduce:active:scale-100`}
        >
          <Avatar
            tamano={46}
            ruta={avatarPath}
            respaldo={
              <Image
                src={ILUSTRACIONES.corazonAudifonos.src}
                alt=""
                width={40}
                height={46}
                priority
                data-corazon-perfil=""
                className="h-[46px] w-auto"
              />
            }
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

      {/* La accion principal del Inicio se desliza (v2.9.0); tambien se toca. */}
      <BotonDeslizar
        href="/escanear"
        label="Escanear QR"
        variante="amarillo"
        ariaLabel="Escanear QR. Desliza o toca para abrir el escáner."
        className="mt-[14px]"
      />

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
          {/* Lleva el circulo con flecha, asi que se desliza (v2.13.0); tambien se toca. */}
          <BotonDeslizar
            href="/beats"
            label="Ver historial"
            variante="navy"
            ariaLabel="Desliza para ver tu historial"
            className="mt-1.5"
          />
        </Acordeon>

        <Acordeon titulo="Qué es Latidos" subtitulo="El programa y sus 3 fases" icono={<IconoCorazon />}>
          <QueEsLatidos />
        </Acordeon>
      </div>

      <HojaNotificaciones abierta={hojaAbierta} alCerrar={cerrarHoja} />
    </>
  );
}
