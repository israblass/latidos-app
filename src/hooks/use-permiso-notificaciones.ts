"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Tope de espera del dialogo del navegador antes de dar por no concedido. */
const ESPERA_MAXIMA_MS = 10_000;

export type EstadoPermiso =
  | "no-soportado"
  | "sin-pedir"
  | "concedido"
  | "denegado";

/**
 * Solicita el permiso de notificaciones push.
 *
 * Se pide dentro del onboarding y orientado a avisos de valor: nuevas jornadas,
 * artistas confirmados, novedades del programa (spec §9 regla 6). Sumar Beats al
 * escanear un QR NO dispara push; esa confirmacion ocurre solo en pantalla.
 *
 * Se pide con un toque explicito y no al cargar: Safari exige interaccion de la
 * persona para mostrar el dialogo, y un permiso pedido de golpe se deniega mas.
 *
 * Aqui solo se resuelve el permiso. La suscripcion con llaves VAPID llega
 * cuando se construya el envio de notificaciones, y no requiere volver a pedir
 * el permiso a quien ya lo concedio.
 */
export function usePermisoNotificaciones() {
  const [estado, setEstado] = useState<EstadoPermiso>("sin-pedir");
  const [pidiendo, setPidiendo] = useState(false);
  const yaSincronizado = useRef(false);

  const informarAlServidor = useCallback(async (concedido: boolean) => {
    try {
      await fetch("/api/usuario/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permiso_otorgado: concedido }),
      });
    } catch {
      // El permiso vive en el navegador de todos modos; que no se registre en
      // el perfil no puede frenar el onboarding.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setEstado("no-soportado");
      return;
    }

    if (Notification.permission === "granted") {
      setEstado("concedido");
      // El permiso podia venir concedido de antes (otra pestaña, o una visita
      // previa). Sin esto la pantalla diria que los avisos estan activos
      // mientras el perfil sigue marcando que no.
      if (!yaSincronizado.current) {
        yaSincronizado.current = true;
        void informarAlServidor(true);
      }
      return;
    }

    setEstado(Notification.permission === "denied" ? "denegado" : "sin-pedir");
  }, [informarAlServidor]);

  const solicitar = useCallback(async () => {
    if (!("Notification" in window)) return;

    setPidiendo(true);
    try {
      // El navegador no siempre resuelve esta promesa: si suprime el dialogo o
      // la persona lo ignora, se queda pendiente para siempre. Sin este limite
      // la tarjeta se quedaria congelada en "Esperando...".
      const resultado = await Promise.race([
        Notification.requestPermission(),
        new Promise<NotificationPermission>((resolver) =>
          setTimeout(() => resolver(Notification.permission), ESPERA_MAXIMA_MS),
        ),
      ]);

      const concedido = resultado === "granted";
      setEstado(concedido ? "concedido" : "denegado");
      yaSincronizado.current = true;
      await informarAlServidor(concedido);
    } catch {
      setEstado("denegado");
    } finally {
      setPidiendo(false);
    }
  }, [informarAlServidor]);

  return { estado, pidiendo, solicitar };
}
