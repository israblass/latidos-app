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
      {/*
        TODO(assets): falta la tercera ilustracion del onboarding. El zip trae
        `onboarding-1-comunidad` y `onboarding-2-escanear`, pero no la de esta
        pantalla, y el encargo describe tres slides. No se pone nada en su
        lugar: un dibujo de libreria desentonaria con el par que si existe. Al
        recibirla: <IlustracionOnboarding nombre="onboarding-3-..." /> aqui
        arriba, con mt-2 en la card de abajo, igual que en las otras dos.
      */}
      <div className="vidrio-medio px-5 py-7 text-center">
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

      <div className="vidrio-medio mt-4 p-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            // Dentro de una card que ya es vidrio: baja un nivel, nunca dos
            // seguidos de vidrio-medio (el desenfoque es caro y se acumula).
            className="vidrio-sutil flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-secundario"
          >
            {/*
              TODO(assets): falta `iconos/icono-notificacion.webp`. El encargo
              lo asigna a esta card, pero no venia en el zip de recursos (trae
              13 de los 15 iconos). Mientras tanto se deja la campana dibujada
              a mano que ya estaba, no un icono de libreria. Al recibirlo:
              sustituir por <IconoAsset nombre="icono-notificacion" /> y borrar
              IconoCampana de components/onboarding/iconos.
            */}
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
