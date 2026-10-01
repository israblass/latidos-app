"use client";

import { useCallback, useEffect, useState } from "react";

import { useAlVolver } from "@/hooks/use-al-volver";
import { leerCache } from "@/lib/beats/cache";
import { leerHistorial } from "@/lib/beats/consultas";
import type { DiaHistorial } from "@/types/beats";

/**
 * El lote mas reciente del historial, para el Inicio: alimenta la "Actividad
 * reciente" y el chip "+N esta semana" de la tarjeta de Beats.
 *
 * Se lee en el cliente al montar y al volver a la app. Si la lectura falla
 * (sin red), se usa la copia guardada en el dispositivo si existe; si no hay
 * nada, una lista vacia. Nunca un error a la vista.
 *
 * `null` mientras no hay datos: el chip no se pinta y la lista no salta.
 */
export function useActividadReciente(usuarioId: string): DiaHistorial[] | null {
  const [dias, setDias] = useState<DiaHistorial[] | null>(null);

  const cargar = useCallback(async () => {
    try {
      const pagina = await leerHistorial();
      setDias(pagina.dias);
    } catch {
      const copia = leerCache(usuarioId);
      setDias((actuales) => actuales ?? copia?.dias ?? []);
    }
  }, [usuarioId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useAlVolver(() => void cargar());

  return dias;
}
