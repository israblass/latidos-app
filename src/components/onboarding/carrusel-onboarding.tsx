"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

export const TOTAL_PANTALLAS_ONBOARDING = 3;

interface Props {
  pantalla: number;
  /** Texto del boton que avanza. La ultima pantalla cierra el onboarding. */
  textoAvance: string;
  children: ReactNode;
}

/**
 * Chrome comun de las 3 pantallas del onboarding: boton para saltar, puntos de
 * progreso y boton de avance.
 *
 * "Saltar" esta visible desde la primera pantalla (spec, criterio 9) y hace lo
 * mismo que terminar: marca el onboarding como visto y lleva a Inicio, para que
 * no vuelva a aparecer nunca mas (spec §9 regla 5).
 */
export function CarruselOnboarding({ pantalla, textoAvance, children }: Props) {
  const router = useRouter();
  const [cerrando, setCerrando] = useState(false);
  const esUltima = pantalla === TOTAL_PANTALLAS_ONBOARDING;

  const cerrarOnboarding = useCallback(async () => {
    setCerrando(true);
    try {
      await fetch("/api/usuario/onboarding-completado", { method: "POST" });
    } catch {
      // Si la marca no llega al servidor la persona igual entra a la app; el
      // onboarding volvera a salir la proxima vez, que es preferible a dejarla
      // atrapada aqui por una falla de red.
    }
    router.replace("/inicio");
    router.refresh();
  }, [router]);

  const avanzar = () => {
    if (esUltima) {
      void cerrarOnboarding();
      return;
    }
    router.push(`/onboarding/pantalla-${pantalla + 1}`);
  };

  return (
    // Alto fijo y no minimo: con `min-h-dvh` el contenedor crece con el
    // contenido y el pie baja con el, asi que en una pantalla corta el boton de
    // avanzar termina debajo del pliegue. Con alto fijo, el pie se queda donde
    // esta y lo que scrollea es el contenido.
    <div className="flex h-dvh flex-col px-5 pb-8 pt-4">
      <header className="flex justify-end">
        <button
          type="button"
          onClick={() => void cerrarOnboarding()}
          disabled={cerrando}
          className="boton-ghost -mr-4 text-[14px] text-texto-secundario"
        >
          Saltar
        </button>
      </header>

      {/*
        `min-h-0` no es decorativo: un hijo de flex trae `min-height: auto`, asi
        que no se encoge por debajo de su contenido y el `overflow-y-auto` nunca
        llega a activarse. Sin esto, en una pantalla corta el contenido empuja
        el pie y el boton de avanzar se sale de la vista en vez de que el
        contenido scrollee.
      */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>

      <footer className="pt-6">
        <div
          className="mb-5 flex items-center justify-center gap-2"
          role="status"
          aria-label={`Pantalla ${pantalla} de ${TOTAL_PANTALLAS_ONBOARDING}`}
        >
          {Array.from({ length: TOTAL_PANTALLAS_ONBOARDING }, (_, indice) => (
            <span
              key={indice}
              aria-hidden="true"
              className={`h-2 rounded-full transition-all ${
                indice + 1 === pantalla
                  // Sobre blanco el amarillo no marca el punto activo; el azul si.
                  ? "w-6 bg-secundario"
                  : "w-2 bg-black/10"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={avanzar}
          disabled={cerrando}
          className="boton-primario"
        >
          {cerrando ? "Un momento..." : textoAvance}
        </button>
      </footer>
    </div>
  );
}
