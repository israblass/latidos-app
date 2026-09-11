"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { LectorQR } from "@/components/escaneo/lector-qr";
import { MensajeLimiteAlcanzado } from "@/components/escaneo/mensaje-limite-alcanzado";
import { MensajeYaEscaneado } from "@/components/escaneo/mensaje-ya-escaneado";
import { useConexion } from "@/hooks/use-conexion";
import { PARAMETRO_QR } from "@/lib/qr/contenido";
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
 * Al reconocer un codigo lo valida contra el servidor. Si sirve, lleva a la
 * pantalla de confirmacion, que es donde la persona decide si canjea; aqui no
 * se otorga nada.
 */
export function PantallaEscaneo({ contenidoInicial }: { contenidoInicial?: string }) {
  const router = useRouter();
  const enLinea = useConexion();
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

    // Sin red no se intenta nada en segundo plano (spec, flujo alternativo 4).
    if (!navigator.onLine) {
      setAviso("sin-conexion");
      validando.current = false;
      return;
    }

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
        // Ojo con el copy de este aviso: para llegar hasta aqui la camara ya
        // leyo el codigo y el servidor lo rechazo. Decir "no pudimos leer el
        // codigo, enfoca mejor" seria mentir sobre la causa y mandar a la
        // persona (o a quien depure) a perseguir un problema de camara que no
        // existe. El escaner sigue vivo de todos modos.
        setAviso("qr_invalido");
        setEstado({ fase: "escaneando" });
        return;
      }

      if (resultado.valido) {
        // El codigo sirve: la decision de canjear se toma en su propia
        // pantalla, y los Beats solo se otorgan si se confirma alli.
        router.push(
          `/escanear/confirmar?${PARAMETRO_QR}=${resultado.qr_marca_id}`,
        );
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
  }, [router]);

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

            {aviso || !enLinea ? (
              <div
                role="status"
                className="mt-4 rounded-control border-l-[3px] border-alerta bg-fondo-alterno px-4 py-3 text-[14px] text-texto-secundario"
              >
                {aviso === "qr_invalido" && enLinea
                  ? "Ese codigo no esta activo. Busca otro QR de marca y vuelve a intentar."
                  : "Te quedaste sin señal. Intenta de nuevo cuando tengas conexion."}
              </div>
            ) : null}
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
