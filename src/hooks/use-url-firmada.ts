"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAlVolver } from "@/hooks/use-al-volver";
import { BUCKET_AVATARES, VIDA_URL_FIRMADA } from "@/lib/avatar";
import { crearClienteNavegador } from "@/lib/supabase/client";

/** Se pide una nueva un minuto antes de que venza. */
const MARGEN_MS = 60_000;

/**
 * URL firmada (1 hora) de un archivo del bucket privado `avatares`. Se renueva
 * sola antes de vencer y al volver a la app (o recuperar la red) si ya vencio
 * o no se pudo pedir. Sin red devuelve null: quien la usa muestra las
 * iniciales.
 */
export function useUrlFirmada(ruta: string | null | undefined): string | null {
  const [firmada, setFirmada] = useState<{ ruta: string; url: string; vence: number } | null>(null);
  const actual = useRef(ruta);
  actual.current = ruta;

  const pedir = useCallback(async () => {
    const pedida = actual.current;
    if (!pedida) return;
    const { data } = await crearClienteNavegador()
      .storage.from(BUCKET_AVATARES)
      .createSignedUrl(pedida, VIDA_URL_FIRMADA);
    // Si la ruta cambio mientras tanto, esta respuesta ya no sirve.
    if (actual.current !== pedida) return;
    setFirmada(
      data?.signedUrl
        ? { ruta: pedida, url: data.signedUrl, vence: Date.now() + VIDA_URL_FIRMADA * 1000 }
        : null,
    );
  }, []);

  useEffect(() => {
    setFirmada(null);
    if (ruta) void pedir();
  }, [ruta, pedir]);

  useEffect(() => {
    if (!firmada) return;
    const temporizador = window.setTimeout(
      () => void pedir(),
      Math.max(0, firmada.vence - Date.now() - MARGEN_MS),
    );
    return () => window.clearTimeout(temporizador);
  }, [firmada, pedir]);

  useAlVolver(
    () => {
      if (!firmada || firmada.vence - Date.now() < MARGEN_MS) void pedir();
    },
    { activo: Boolean(ruta) },
  );

  return firmada && firmada.ruta === ruta ? firmada.url : null;
}
