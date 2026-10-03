"use client";

import { useEffect, useState } from "react";

import { PromptAndroid } from "@/components/instalacion/prompt-android";
import { PromptIOS } from "@/components/instalacion/prompt-ios";
import {
  fueDescartadoHacePoco,
  marcarDescartado,
} from "@/components/instalacion/memoria-descarte";
import { usePlataforma } from "@/hooks/use-plataforma";

/**
 * Decide cual prompt de instalacion mostrar sobre la bienvenida.
 *
 * Nada de lo que hay aqui bloquea el registro ni el resto de la app (spec §9
 * regla 15): los prompts se cierran y la persona sigue. Cuando estan cerrados
 * queda un boton discreto, siempre disponible, para quien quiera instalar
 * despues.
 */
export function PromptsInstalacion({
  ubicacion = "en-linea",
}: {
  /**
   * "en-linea": donde se ponga, en el flujo. "arriba" (bienvenida, v2.10.0):
   * el aviso de Android flota arriba y el boton para reabrirlo es un icono en
   * la esquina, para no chocar con el logo ni con los botones fijos de abajo.
   */
  ubicacion?: "en-linea" | "arriba";
} = {}) {
  const { plataforma, esStandalone, listo } = usePlataforma();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!listo || esStandalone) return;
    setVisible(!fueDescartadoHacePoco());
  }, [listo, esStandalone]);

  // Ya la tiene instalada, o todavia no sabemos en que esta: nada que ofrecer.
  if (!listo || esStandalone) return null;

  const cerrar = () => {
    marcarDescartado();
    setVisible(false);
  };

  if (visible) {
    if (plataforma === "ios") return <PromptIOS onCerrar={cerrar} />;
    // En escritorio Chrome tambien dispara beforeinstallprompt, y el banner
    // sirve igual.
    const android = <PromptAndroid onCerrar={cerrar} />;
    return ubicacion === "arriba" ? (
      <div className="fixed inset-x-4 top-[max(12px,env(safe-area-inset-top))] z-40 mx-auto max-w-md">{android}</div>
    ) : (
      android
    );
  }

  if (ubicacion === "arriba") {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        aria-label="Instalar la app"
        className="fixed right-1 top-[max(6px,env(safe-area-inset-top))] z-30 flex h-12 w-12 items-center justify-center rounded-full text-texto-secundario outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-secundario"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      className="boton-ghost mx-auto mt-2 text-[13px]"
    >
      Instalar la app
    </button>
  );
}
