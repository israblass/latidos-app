"use client";

import { useEffect } from "react";

/**
 * Registra el service worker. Sin el no hay cache del shell y, en Android, el
 * navegador tampoco ofrece instalar la app.
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Que falle el registro no puede tumbar la app: sin service worker
        // sigue siendo completamente funcional, solo sin cache ni instalacion.
      });
    };

    // Despues de la carga, para no competir por ancho de banda con la pantalla
    // que la persona esta esperando (constitution §9: menos de 3s en 4G).
    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });

    return () => window.removeEventListener("load", registrar);
  }, []);

  return null;
}
