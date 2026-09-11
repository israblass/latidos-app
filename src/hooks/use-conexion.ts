"use client";

import { useEffect, useState } from "react";

/**
 * Estado de conexion del navegador (T057).
 *
 * Sirve para no disparar una peticion que se sabe condenada y avisar de una vez
 * (spec, flujo alternativo 4). No reemplaza al manejo de error del fetch:
 * `navigator.onLine` solo sabe si hay interfaz de red levantada, no si el
 * servidor responde, asi que una peticion puede fallar igual con `true`.
 *
 * Arranca en `true` a proposito: durante el render del servidor no hay
 * `navigator`, y suponer que no hay red mostraria un aviso falso en cada carga.
 */
export function useConexion(): boolean {
  const [enLinea, setEnLinea] = useState(true);

  useEffect(() => {
    const actualizar = () => setEnLinea(navigator.onLine);

    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);

    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  return enLinea;
}
