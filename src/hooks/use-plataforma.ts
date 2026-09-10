"use client";

import { useEffect, useState } from "react";

export type Plataforma = "ios" | "android" | "otro";

export interface EstadoPlataforma {
  plataforma: Plataforma;
  /** La app ya corre instalada, fuera del navegador. */
  esStandalone: boolean;
  /** Falso durante el primer render del servidor, donde no hay navigator. */
  listo: boolean;
}

const ESTADO_INICIAL: EstadoPlataforma = {
  plataforma: "otro",
  esStandalone: false,
  listo: false,
};

function detectarPlataforma(): Plataforma {
  const ua = navigator.userAgent;

  if (/android/i.test(ua)) return "android";

  // iPadOS 13+ se anuncia como Macintosh; el unico rasgo que lo distingue de
  // una Mac de escritorio es que reporta puntos de contacto.
  const esIpadModerno = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/.test(ua) || esIpadModerno) return "ios";

  return "otro";
}

function detectarStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari en iOS no soporta display-mode y usa esta propiedad propia.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Detecta si la persona esta en iOS, Android u otra plataforma, y si ya tiene
 * la app instalada. Se resuelve en el cliente porque depende de `navigator`.
 */
export function usePlataforma(): EstadoPlataforma {
  const [estado, setEstado] = useState<EstadoPlataforma>(ESTADO_INICIAL);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");

    const actualizar = () =>
      setEstado({
        plataforma: detectarPlataforma(),
        esStandalone: detectarStandalone(),
        listo: true,
      });

    actualizar();

    // Si la persona instala la app con la pestaña abierta, deja de ser
    // navegador y los prompts sobran.
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);

  return estado;
}
