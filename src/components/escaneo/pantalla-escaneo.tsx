"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { LectorQR } from "@/components/escaneo/lector-qr";
import { MensajeLimiteAlcanzado } from "@/components/escaneo/mensaje-limite-alcanzado";
import { MensajeYaEscaneado } from "@/components/escaneo/mensaje-ya-escaneado";
import type { ResultadoValidacion } from "@/types/qr";

type Estado =
  | { fase: "escaneando" }
  | { fase: "validando" }
  | { fase: "resuelto"; resultado: ResultadoValidacion };

/**
 * Un codigo ilegible no apaga el escaner (spec, flujo alternativo 3): el aviso
 * aparece debajo del visor y la persona solo tiene que reencuadrar.
 */
type Aviso = "qr_invalido" | "sin-conexion" | null;

/**
 * Tiempo que se ignora una lectura identica. Un codigo que se queda en cuadro
 * se lee muchas veces por segundo; sin esto, el mismo codigo malo dispararia
 * una validacion tras otra.
 */
const ESPERA_MISMA_LECTURA_MS = 3000;

/**
 * Escaneo de QR de marca (T039, T043).
 *
 * Fase 4 llega hasta la validacion: dice si el codigo sirve, de que marca es y
 * cuantos Beats estarian en juego. Ni otorga Beats ni mueve contadores; la
 * pantalla de confirmacion y el canje son de la Fase 5.
 */
export function PantallaEscaneo({ contenidoInicial }: { contenidoInicial?: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "escaneando" });
  const [aviso, setAviso] = useState<Aviso>(null);

  // Evita que el lector dispare la misma lectura varias veces mientras el
  // servidor responde.
  const validando = useRef(false);
  const ultimaLectura = useRef<{ contenido: string; momento: number } | null>(null);

  const validar = useCallback(async (contenido: string) => {
    if (validando.current) return;

    const previa = ultimaLectura.current;
    if (
      previa?.contenido === contenido &&
      Date.now() - previa.momento < ESPERA_MISMA_LECTURA_MS
    ) {
      return;
    }
    ultimaLectura.current = { contenido, momento: Date.now() };

    validando.current = true;
    setAviso(null);
    setEstado({ fase: "validando" });

    try {
      const respuesta = await fetch("/api/qr/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      });

      const resultado: ResultadoValidacion = respuesta.ok
        ? await respuesta.json()
        : { valido: false, motivo: "qr_invalido" };

      if (!resultado.valido && resultado.motivo === "qr_invalido") {
        // El escaner sigue vivo: basta con reencuadrar.
        setAviso("qr_invalido");
        setEstado({ fase: "escaneando" });
        return;
      }

      setEstado({ fase: "resuelto", resultado });
    } catch {
      // Sin red no se intenta nada en segundo plano: se avisa y se espera a que
      // la persona reintente (spec, flujo alternativo 4).
      setAviso("sin-conexion");
      setEstado({ fase: "escaneando" });
    } finally {
      validando.current = false;
    }
  }, []);

  // Un QR impreso como URL puede abrir la app directamente con el codigo ya
  // puesto; en ese caso no hace falta pasar por la camara.
  const yaValidoElInicial = useRef(false);
  useEffect(() => {
    if (contenidoInicial && !yaValidoElInicial.current) {
      yaValidoElInicial.current = true;
      void validar(contenidoInicial);
    }
  }, [contenidoInicial, validar]);

  const volverAEscanear = () => {
    setAviso(null);
    ultimaLectura.current = null;
    setEstado({ fase: "escaneando" });
  };

  const botonReintentar = (
    <button type="button" onClick={volverAEscanear} className="boton-primario">
      Escanear otro
    </button>
  );
  const botonInicio = (
    <Link href="/inicio" className="boton-secundario">
      Volver a Inicio
    </Link>
  );

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8 pt-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="titulo-pantalla">Escanear</h1>
        <Link
          href="/inicio"
          aria-label="Cerrar el escaner"
          className="-mr-2 flex h-12 w-12 items-center justify-center rounded-control text-texto-secundario transition-opacity active:opacity-60"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Link>
      </header>

      <div className="mt-6 flex flex-1 flex-col justify-center">
        {estado.fase === "escaneando" || estado.fase === "validando" ? (
          <div>
            <LectorQR onLeer={validar} activo={estado.fase === "escaneando"} />

            <p
              aria-live="polite"
              className="mt-5 text-center text-[15px] text-texto-secundario"
            >
              {estado.fase === "validando"
                ? "Validando el codigo..."
                : "Enfoca el QR de la marca."}
            </p>

            {aviso ? (
              <div
                role="status"
                className="mt-4 rounded-control border-l-[3px] border-alerta bg-fondo-alterno px-4 py-3 text-[14px] text-texto-secundario"
              >
                {aviso === "qr_invalido"
                  ? "No pudimos leer el codigo. Asegurate de enfocar bien y vuelve a intentar."
                  : "Te quedaste sin señal. Intenta de nuevo cuando tengas conexion."}
              </div>
            ) : null}
          </div>
        ) : null}

        {estado.fase === "resuelto" && estado.resultado.valido ? (
          <div className="tarjeta flex flex-col items-center px-5 py-8 text-center">
            <p className="etiqueta">Codigo valido</p>
            <h2 className="font-display mt-2 text-[26px] uppercase leading-tight text-texto-principal">
              {estado.resultado.marca.nombre}
            </h2>

            <div className="bloque-oscuro mt-6 w-full px-5 py-6">
              <p className="font-display text-[48px] leading-none text-primario">
                +{estado.resultado.beats_en_juego}
              </p>
              <p className="etiqueta mt-1 text-white/70">Beats en juego</p>
            </div>

            {/* Fase 4 valida, no otorga. El canje llega en la Fase 5. */}
            <p className="mt-5 text-[15px] text-texto-secundario">
              Todavia no sumaste estos Beats: falta confirmar el canje.
            </p>

            <div className="mt-7 flex w-full flex-col gap-3">
              {botonReintentar}
              {botonInicio}
            </div>
          </div>
        ) : null}

        {estado.fase === "resuelto" && !estado.resultado.valido ? (
          <>
            {estado.resultado.motivo === "ya_escaneado_hoy" ? (
              <MensajeYaEscaneado
                marca="esta marca"
                acciones={
                  <>
                    {botonReintentar}
                    {botonInicio}
                  </>
                }
              />
            ) : null}

            {estado.resultado.motivo === "limite_alcanzado" ? (
              <MensajeLimiteAlcanzado
                acciones={
                  <>
                    {botonReintentar}
                    {botonInicio}
                  </>
                }
              />
            ) : null}

          </>
        ) : null}
      </div>
    </main>
  );
}
