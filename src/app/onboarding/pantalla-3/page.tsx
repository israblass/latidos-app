"use client";

import { CarruselOnboarding } from "@/components/onboarding/carrusel-onboarding";
import { IconoCampana } from "@/components/onboarding/iconos";
import { IlustracionOnboarding } from "@/components/onboarding/ilustracion";
import { ILUSTRACIONES } from "@/lib/ilustraciones";
import { usePermisoNotificaciones } from "@/hooks/use-permiso-notificaciones";
import { TituloConAcento } from "@/components/marca/titulo-con-acento";

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
      <IlustracionOnboarding
        ilustracion={ILUSTRACIONES.figuraAmarillaCorazon}
        descripcion="Una figura amarilla que sostiene un pequeño corazón"
      />
      <div className="vidrio mt-3 px-5 py-7 text-center">
        <TituloConAcento etiqueta="Todo listo" detalle="Tu cuenta está activa y ya tienes tu bono de bienvenida.">
          Empieza a
          <br />
          sumar
        </TituloConAcento>
      </div>

      <div className="superficie mt-4 p-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            // Dentro de una card blanca: un cuadro crema, sin otra capa de
            // vidrio (como mucho dos capas con desenfoque a la vez).
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-fondo text-secundario"
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
