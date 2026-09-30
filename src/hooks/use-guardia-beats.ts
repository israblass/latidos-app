"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { leerResumen } from "@/lib/beats/consultas";
import type { ResumenBeats } from "@/types/beats";

/**
 * Guardia de sesion de la pantalla de Beats (plan §4, decision 11).
 *
 * Aplica las mismas reglas que Inicio: sin sesion (o sin perfil) a
 * /registro/confirma-tu-correo, y sin el onboarding visto a su primera
 * pantalla (spec §8.12). La diferencia es que corre en el cliente: la pantalla
 * de Beats tiene que poder abrirse sin señal desde la copia del service
 * worker, y un guardia de servidor la mandaria siempre a /sin-conexion.
 *
 * Si la lectura falla (sin red, o el servidor no responde) NO redirige: quien
 * ya tenia sesion no puede quedar expulsado por una caida de señal. En ese caso
 * entrega `sinVerificar`, y la pantalla decide con lo que tenga guardado.
 */

export type EstadoGuardia =
  | { estado: "verificando" }
  | { estado: "redirigiendo" }
  | { estado: "listo"; resumen: ResumenBeats }
  | { estado: "sinVerificar" };

export const RUTA_SIN_SESION = "/registro/confirma-tu-correo";
export const RUTA_ONBOARDING = "/onboarding/pantalla-1";

export function useGuardiaBeats(): EstadoGuardia & { reintentar: () => void } {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoGuardia>({ estado: "verificando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    leerResumen()
      .then((resumen) => {
        if (!vigente) return;
        if (!resumen) {
          setEstado({ estado: "redirigiendo" });
          router.replace(RUTA_SIN_SESION);
        } else if (!resumen.onboarding_visto) {
          setEstado({ estado: "redirigiendo" });
          router.replace(RUTA_ONBOARDING);
        } else {
          setEstado({ estado: "listo", resumen });
        }
      })
      .catch(() => {
        if (vigente) setEstado({ estado: "sinVerificar" });
      });

    return () => {
      vigente = false;
    };
  }, [router, intento]);

  const reintentar = useCallback(() => {
    setEstado({ estado: "verificando" });
    setIntento((n) => n + 1);
  }, []);

  return { ...estado, reintentar };
}
