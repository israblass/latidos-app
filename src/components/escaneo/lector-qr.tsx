"use client";

import { useEffect, useRef, useState } from "react";

export type EstadoCamara = "iniciando" | "activa" | "sin-permiso" | "sin-camara";

interface Props {
  /** Se llama con el contenido del codigo apenas se reconoce. */
  onLeer: (contenido: string) => void;
  /** Mientras es false el lector se detiene, sin soltar la camara. */
  activo: boolean;
  onEstado?: (estado: EstadoCamara) => void;
}

/**
 * Visor de camara que reconoce el QR solo, sin boton de captura
 * (spec §9 regla 7).
 *
 * La libreria se carga con import dinamico porque solo existe en el navegador
 * y pesa lo suyo: no tiene por que entrar en el bundle de las pantallas que no
 * escanean.
 */
export function LectorQR({ onLeer, activo, onEstado }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<EstadoCamara>("iniciando");

  // En refs para que el efecto que arranca la camara no dependa de ellos: si
  // dependiera, cada render la apagaria y encenderia de nuevo.
  const alLeer = useRef(onLeer);
  const alCambiarEstado = useRef(onEstado);
  alLeer.current = onLeer;
  alCambiarEstado.current = onEstado;

  const estaActivo = useRef(activo);
  estaActivo.current = activo;

  useEffect(() => {
    let escaner: import("qr-scanner").default | null = null;
    let cancelado = false;

    const cambiar = (nuevo: EstadoCamara) => {
      if (cancelado) return;
      setEstado(nuevo);
      alCambiarEstado.current?.(nuevo);
    };

    (async () => {
      const { default: QrScanner } = await import("qr-scanner");

      if (cancelado || !video.current) return;

      if (!(await QrScanner.hasCamera())) {
        cambiar("sin-camara");
        return;
      }

      escaner = new QrScanner(
        video.current,
        (resultado) => {
          // El lector sigue disparando mientras el codigo este a la vista; se
          // ignora todo lo que llegue mientras se resuelve la lectura anterior.
          if (!estaActivo.current) return;
          alLeer.current(resultado.data);
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        },
      );

      try {
        await escaner.start();

        // qr-scanner inyecta su propio overlay (el recuadro de la zona de
        // escaneo y el contorno del codigo). Es decorativo, pero el markup no
        // es nuestro y viene sin aria-hidden, asi que un lector de pantalla lo
        // anunciaria como contenido. Se marca aqui, tras montarlo.
        video.current?.parentElement
          ?.querySelectorAll<SVGElement>("svg:not([aria-hidden])")
          .forEach((overlay) => overlay.setAttribute("aria-hidden", "true"));

        cambiar("activa");
      } catch {
        // Negar el permiso y no tener camara llegan igual; se informa el caso
        // mas util, que es el que la persona puede resolver.
        cambiar("sin-permiso");
      }
    })();

    return () => {
      cancelado = true;
      escaner?.destroy();
    };
  }, []);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-card bg-oscuro">
      <video
        ref={video}
        className="h-full w-full object-cover"
        playsInline
        muted
        aria-label="Camara para escanear el codigo"
      />

      {estado !== "activa" ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="text-sm text-white/80">
            {estado === "iniciando" ? "Abriendo la camara..." : null}
            {estado === "sin-permiso"
              ? "Habilita la camara desde la configuracion de tu navegador para escanear."
              : null}
            {estado === "sin-camara"
              ? "Este dispositivo no tiene camara disponible."
              : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
