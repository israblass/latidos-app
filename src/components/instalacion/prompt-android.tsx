"use client";

import { useCallback, useEffect, useState } from "react";

import { ImagenMarca } from "@/components/marca/imagen-marca";
import { ASSETS } from "@/lib/assets";

/** Evento propio de Chromium, todavia fuera del estandar y sin tipos propios. */
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props {
  onCerrar: () => void;
}

/**
 * Banner de instalacion para Android.
 *
 * Chrome dispara `beforeinstallprompt` cuando la app cumple los criterios de
 * instalabilidad (manifest con iconos, service worker con handler de fetch,
 * origen seguro). Ese evento se guarda y se dispara el dialogo nativo del
 * sistema cuando la persona toca el boton (spec §10 suposicion 2).
 *
 * Si el evento nunca llega, este componente no pinta nada: no tiene sentido
 * ofrecer instalar algo que el navegador no va a instalar.
 */
export function PromptAndroid({ onCerrar }: Props) {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);

  useEffect(() => {
    const alPoderInstalar = (e: Event) => {
      // Sin esto Chrome muestra su propio mini-infobar y perdemos el control
      // de cuando aparece.
      e.preventDefault();
      setEvento(e as EventoInstalacion);
    };

    const alInstalar = () => setEvento(null);

    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    // El evento no se puede reutilizar, haya aceptado o no.
    setEvento(null);
  }, [evento]);

  if (!evento) return null;

  return (
    // En el flujo normal de la pantalla, no flotando: un banner fijo al fondo
    // taparia el boton de registrarse, y la spec (§9 regla 15) pide que el
    // prompt no estorbe el registro.
    <div className="tarjeta-plana">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-control bg-fondo">
          <ImagenMarca src={ASSETS.latidosHero} alt="Latidos" alto={30} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-texto-principal">
            Instalar Latidos
          </p>
          <p className="text-xs text-texto-secundario">
            Abrela desde tu pantalla de inicio.
          </p>
        </div>

        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="-mr-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-control text-texto-secundario transition-opacity active:opacity-60"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Secundario: el amarillo es de "Registrarme", que es la accion que
          importa en esta pantalla. */}
      <button type="button" onClick={instalar} className="boton-secundario mt-4">
        Instalar
      </button>
    </div>
  );
}
