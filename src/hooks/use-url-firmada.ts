"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAlVolver } from "@/hooks/use-al-volver";
import { BUCKET_AVATARES, VIDA_URL_FIRMADA } from "@/lib/avatar";
import { crearClienteNavegador } from "@/lib/supabase/client";

/** Se pide una nueva un minuto antes de que venza. */
const MARGEN_MS = 60_000;

/*
 * Cache en memoria de las URL firmadas, por ruta (avatar_path). Asi Inicio y
 * Perfil, o el mismo avatar al volver a una pantalla, no firman dos veces lo
 * mismo. La clave es la ruta: cada foto nueva tiene una ruta nueva
 * (avatar-<marca de tiempo>), asi que nunca se reusa la URL de un archivo
 * borrado. Quien borra una foto la olvida con `olvidarUrlFirmada`.
 */
const cache = new Map<string, { url: string; vence: number }>();

const vigente = (ruta: string) => {
  const guardada = cache.get(ruta);
  return guardada && guardada.vence - Date.now() > MARGEN_MS ? guardada : null;
};

/** Saca una ruta del cache (al cambiar o quitar la foto). */
export function olvidarUrlFirmada(ruta: string | null | undefined) {
  if (ruta) cache.delete(ruta);
}

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
    const enCache = vigente(pedida);
    if (enCache) {
      setFirmada({ ruta: pedida, ...enCache });
      return;
    }
    const { data } = await crearClienteNavegador()
      .storage.from(BUCKET_AVATARES)
      .createSignedUrl(pedida, VIDA_URL_FIRMADA);
    // Si la ruta cambio mientras tanto, esta respuesta ya no sirve.
    const nueva = data?.signedUrl
      ? { url: data.signedUrl, vence: Date.now() + VIDA_URL_FIRMADA * 1000 }
      : null;
    if (nueva) cache.set(pedida, nueva);
    if (actual.current !== pedida) return;
    setFirmada(nueva ? { ruta: pedida, ...nueva } : null);
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
