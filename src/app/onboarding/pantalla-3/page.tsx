"use client";

import { CarruselOnboarding } from "@/components/onboarding/carrusel-onboarding";
import { IconoCampana } from "@/components/onboarding/iconos";
import { usePermisoNotificaciones } from "@/hooks/use-permiso-notificaciones";

/**
 * Pantalla 3: cierre del onboarding.
 *
 * Aqui se pide el permiso de notificaciones (spec §9 regla 6). Si la persona no
 * lo concede, el onboarding sigue igual hasta Inicio: el permiso nunca bloquea
 * (spec, flujo alternativo 8).
 */
export default function PantallaCierre() {
  const { estado, pidiendo, solicitar } = usePermisoNotificaciones();

  return (
    <CarruselOnboarding pantalla={3} textoAvance="Empezar">
      {/* Acento amarillo y no bloque amarillo: el boton de avanzar es el unico
          amarillo grande de la pantalla. */}
      <div className="rounded-card bg-fondo-alterno px-5 py-7 text-center">
        <p className="etiqueta">Todo listo</p>
        <h1 className="font-display mt-2 text-[34px] uppercase leading-none text-texto-principal">
          Empieza a
          <br />
          sumar
        </h1>
        <div
          aria-hidden="true"
          className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-primario"
        />
        <p className="mt-4 text-[15px] text-texto-secundario">
          Tu cuenta esta activa y tu contador arranca en cero.
        </p>
      </div>

      <div className="tarjeta mt-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-fondo-alterno text-secundario"
          >
            <IconoCampana />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-texto-principal">
              Avisos del programa
            </p>
            <p className="text-xs text-texto-secundario">
              Nuevas jornadas, artistas confirmados y novedades. Nada mas.
            </p>
          </div>
        </div>

        {estado === "sin-pedir" ? (
          <button
            type="button"
            onClick={() => void solicitar()}
            disabled={pidiendo}
            className="boton-secundario mt-4"
          >
            {pidiendo ? "Esperando..." : "Activar avisos"}
          </button>
        ) : null}

        {estado === "concedido" ? (
          <p className="mt-4 text-sm text-exito-texto">Avisos activados.</p>
        ) : null}

        {estado === "denegado" ? (
          <p className="mt-4 text-sm text-texto-secundario">
            Sin avisos por ahora. Puedes activarlos desde la configuracion de tu
            navegador cuando quieras.
          </p>
        ) : null}

        {estado === "no-soportado" ? (
          <p className="mt-4 text-sm text-texto-secundario">
            Este navegador no soporta avisos. La app funciona igual.
          </p>
        ) : null}
      </div>
    </CarruselOnboarding>
  );
}
