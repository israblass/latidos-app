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
export function PromptsInstalacion() {
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
    if (plataforma === "android") return <PromptAndroid onCerrar={cerrar} />;
    // En escritorio Chrome tambien dispara beforeinstallprompt, y el banner
    // sirve igual.
    return <PromptAndroid onCerrar={cerrar} />;
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
