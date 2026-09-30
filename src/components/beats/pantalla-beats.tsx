"use client";

import { useEffect, useRef } from "react";

import { DiaHistorial } from "@/components/beats/dia-historial";
import { ContadorBeats } from "@/components/marca/contador-beats";
import { TabBar } from "@/components/navegacion/tab-bar";
import { useGuardiaBeats } from "@/hooks/use-guardia-beats";
import { useHistorialBeats } from "@/hooks/use-historial-beats";

/**
 * Pantalla de Beats (T020): saldo, recordatorio del canje e historial por dias.
 *
 * Es una pantalla de cliente a proposito (plan §4, decision 10): el service
 * worker guarda una copia de su HTML, que no lleva datos de nadie, y los datos
 * llegan despues con la sesion de quien la abre. Asi puede abrirse sin señal.
 */

/**
 * Marca el final de la lista: cuando entra en pantalla (o se acerca), pide el
 * siguiente lote de dias. Mas comodo que un boton "Ver mas" en un telefono, y
 * la spec pide que ocurra "sin que tenga que hacer nada" (spec §1).
 */
function FinDeLista({ alVerse, activo }: { alVerse: () => void; activo: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || !activo) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) alVerse();
      },
      { rootMargin: "240px 0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [alVerse, activo]);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}

export function PantallaBeats() {
  const guardia = useGuardiaBeats();
  const resumenGuardia = guardia.estado === "listo" ? guardia.resumen : null;
  const historial = useHistorialBeats(resumenGuardia);
  const { resumen, dias, abiertos, estado } = historial;

  const sinDatos = guardia.estado === "sinVerificar" || estado === "error";
  const cargando = !sinDatos && (!resumen || estado === "esperando" || estado === "cargando");

  const reintentar = () => {
    if (guardia.estado === "sinVerificar") guardia.reintentar();
    else void historial.recargar();
  };

  return (
    <>
      <main className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
        <header className="flex min-h-touch items-center justify-between gap-3">
          <h1 className="titulo-pantalla">Beats</h1>
        </header>

        <section aria-label="Tu balance de Beats" className="mt-4">
          <div className="vidrio-medio px-6 py-8 text-center">
            {resumen ? (
              // Sin animacion de entrada (spec §10.11): el numero aparece
              // directo. Solo se anima si cambia con la pantalla abierta.
              <ContadorBeats valor={resumen.saldo} />
            ) : (
              <div className="flex min-h-[132px] items-center justify-center text-texto-secundario">
                {sinDatos ? null : <span className="girador" aria-hidden="true" />}
              </div>
            )}
          </div>
        </section>

        <p className="mt-4 text-center text-[15px] text-texto-secundario">
          Pronto podrás cambiarlos por entradas al concierto, merch y cursos.
        </p>

        <section aria-label="Historial de Beats" aria-busy={cargando} className="mt-6">
          {cargando ? (
            <p className="flex items-center justify-center gap-2 py-6 text-texto-secundario">
              <span className="girador" aria-hidden="true" />
              Cargando tu historial
            </p>
          ) : sinDatos ? (
            <div className="vidrio-medio flex flex-col items-center gap-3 px-5 py-6 text-center">
              <p className="text-texto-principal">No pudimos actualizar.</p>
              <button type="button" onClick={reintentar} className="boton-secundario w-auto">
                Reintentar
              </button>
            </div>
          ) : (
            <div className="vidrio-medio px-4">
              <ul>
                {dias.map((dia) => (
                  <DiaHistorial
                    key={dia.dia_local}
                    dia={dia}
                    abierto={abiertos.has(dia.dia_local)}
                    alAlternar={() => historial.alternarDia(dia.dia_local)}
                  />
                ))}
              </ul>
              <FinDeLista alVerse={historial.cargarMas} activo={historial.hayMas} />
              {historial.cargandoMas ? (
                <p className="flex items-center justify-center gap-2 py-3 text-sm text-texto-secundario">
                  <span className="girador" aria-hidden="true" />
                  Cargando días anteriores
                </p>
              ) : null}
              {historial.errorAlCargarMas ? (
                <div className="flex justify-center py-2">
                  <button
                    type="button"
                    onClick={() => void historial.cargarMas()}
                    className="boton-ghost"
                  >
                    Reintentar
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </main>

      <TabBar />
    </>
  );
}
