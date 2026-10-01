"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DiaHistorial } from "@/components/beats/dia-historial";
import { EstadoInicial } from "@/components/beats/estado-inicial";
import { HojaComoGanar } from "@/components/beats/hoja-como-ganar";
import { AnuncioVivo } from "@/components/beats/anuncio-vivo";
import { CarruselMarcas, HeroBeats, TuPulso } from "@/components/beats/dashboard-beats";
import { CirculoFlecha } from "@/components/ui/circulo-flecha";
import { TabBar } from "@/components/navegacion/tab-bar";
import { AvisoEstado } from "@/components/beats/aviso-estado";
import { SinConexionBeats } from "@/components/beats/sin-conexion-beats";
import { useConexion } from "@/hooks/use-conexion";
import { useGuardiaBeats } from "@/hooks/use-guardia-beats";
import { leerUsuarioDeSesion } from "@/hooks/use-movimientos-en-vivo";
import { borrarCachesAjenas, borrarTodasLasCaches, leerCache } from "@/lib/beats/cache";
import { useHistorialBeats } from "@/hooks/use-historial-beats";
import { marcasDelHistorial, metricasDeLaSemana } from "@/lib/beats/dashboard";

/**
 * Pantalla de Beats (T020), como dashboard desde la v2.8.0 (constitution §2):
 * cabecera "Tus Beats" con la pildora de ayuda, hero navy con el saldo, "Tu
 * pulso" de la semana, carrusel de marcas, historial por dias en acordeon,
 * "Cómo ganar" y el recordatorio del canje.
 *
 * Es una pantalla de cliente a proposito (plan §4, decision 10): el service
 * worker guarda una copia de su HTML, que no lleva datos de nadie, y los datos
 * llegan despues con la sesion de quien la abre. Asi puede abrirse sin señal.
 */

/**
 * Marca el final de la lista: cuando entra en pantalla, pide el siguiente lote
 * de dias. Mas comodo que un boton "Ver mas" en un telefono, y la spec pide que
 * ocurra "sin que tenga que hacer nada" (spec §1).
 *
 * Sin margen de anticipacion a proposito: con los dias cerrados la lista es
 * corta, y un margen hacia que el segundo lote se pidiera al abrir, sin que la
 * persona bajara (la spec dice "al bajar", §11 criterio 22). Si la lista no
 * alcanza a llenar la pantalla, el final ya se ve y el lote se pide solo: asi
 * nunca queda historial al que no se pueda llegar.
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
      { rootMargin: "0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [alVerse, activo]);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}

/** Id de la sesion guardada en el dispositivo; se lee sin ir a la red. */
function useUsuarioLocal() {
  const [usuario, setUsuario] = useState<{ resuelto: boolean; id: string | null }>({
    resuelto: false,
    id: null,
  });
  useEffect(() => {
    let vigente = true;
    void leerUsuarioDeSesion()
      .catch(() => null)
      .then((id) => {
        if (vigente) setUsuario({ resuelto: true, id });
      });
    return () => {
      vigente = false;
    };
  }, []);
  return usuario;
}

export function PantallaBeats() {
  const guardia = useGuardiaBeats();
  const resumenGuardia = guardia.estado === "listo" ? guardia.resumen : null;
  const usuarioLocal = useUsuarioLocal();
  const enLinea = useConexion();
  const historial = useHistorialBeats({
    resumenInicial: resumenGuardia,
    usuarioId: usuarioLocal.id,
  });
  const { resumen, dias, abiertos, estado, origen, hidratar } = historial;
  const [hojaAbierta, setHojaAbierta] = useState(false);

  // Primero lo guardado, al instante; los datos frescos llegan despues (spec
  // §7 paso 2). La copia de otra persona nunca se muestra y se borra al abrir
  // (spec §8.11): solo cuenta la de quien tiene la sesion en este dispositivo.
  useEffect(() => {
    if (!usuarioLocal.resuelto) return;
    if (!usuarioLocal.id) {
      borrarTodasLasCaches();
      return;
    }
    borrarCachesAjenas(usuarioLocal.id);
    const copia = leerCache(usuarioLocal.id);
    if (copia) hidratar(copia);
  }, [usuarioLocal, hidratar]);

  const tieneDatos = origen !== "ninguno" && Boolean(resumen);
  const fallo = guardia.estado === "sinVerificar" || estado === "error";
  const reintentando = guardia.estado === "verificando" || estado === "cargando";
  const cargando = !tieneDatos && !fallo;
  // Del historial que ya esta en pantalla: no se pide nada mas a la red.
  const metricas = useMemo(() => metricasDeLaSemana(dias), [dias]);
  const marcas = useMemo(() => marcasDelHistorial(dias), [dias]);

  // Estable: la hoja la usa como dependencia de su efecto, y una funcion nueva
  // en cada render la haria cerrarse y abrirse de nuevo.
  const cerrarHoja = useCallback(() => setHojaAbierta(false), []);

  const { reintentar: reintentarGuardia } = guardia;
  const { recargar } = historial;
  const estadoGuardia = guardia.estado;
  const reintentar = useCallback(() => {
    if (estadoGuardia !== "listo") reintentarGuardia();
    else void recargar();
  }, [estadoGuardia, reintentarGuardia, recargar]);

  // Al volver la señal, la pantalla se pone al dia sola (spec §8.2).
  const estabaSinRed = useRef(false);
  useEffect(() => {
    if (!enLinea) {
      estabaSinRed.current = true;
      return;
    }
    if (estabaSinRed.current) {
      estabaSinRed.current = false;
      reintentar();
    }
  }, [enLinea, reintentar]);

  if (!tieneDatos && fallo && !enLinea) {
    return (
      <>
        <main className="flex min-h-dvh flex-col px-5 espacio-barra pt-6">
          <h1 className="titulo-pantalla">Beats</h1>
          <SinConexionBeats />
        </main>
        <TabBar />
      </>
    );
  }

  return (
    <>
      <main className="relative isolate flex min-h-dvh flex-col px-4 espacio-barra pt-[max(22px,env(safe-area-inset-top))]">
        {/* El mismo degradado de marca del Inicio: una sola definicion. */}
        <div aria-hidden="true" className="fondo-inicio" />
        {tieneDatos && !enLinea ? (
          <AvisoEstado tipo="sin-conexion" actualizadoEn={historial.actualizadoEn} />
        ) : tieneDatos && fallo ? (
          <AvisoEstado tipo="error" alReintentar={reintentar} reintentando={reintentando} />
        ) : null}

        <header className="flex items-start justify-between gap-3">
          <h1 className="mx-1 pt-2 text-[40px] font-light leading-[1.1] tracking-[-0.01em] text-texto-principal">
            Tus <b className="block font-bold">Beats</b>
          </h1>
          {/* La pildora de ayuda de siempre, ahora navy (v2.8.0). */}
          <button
            type="button"
            onClick={() => setHojaAbierta(true)}
            aria-haspopup="dialog"
            aria-label="¿Cómo gano Beats?"
            className="flex h-[58px] w-[108px] shrink-0 items-center justify-center rounded-full bg-texto-principal text-texto-inverso outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secundario active:scale-[0.97] motion-reduce:active:scale-100"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.8M12 17h.01" />
            </svg>
          </button>
        </header>

        <HeroBeats saldo={resumen?.saldo ?? null} beatsSemana={metricas.beats} cargando={!fallo} />

        <div className="mt-4 flex flex-col gap-4">
          <TuPulso metricas={metricas} />

          <CarruselMarcas marcas={marcas} />

          <section aria-label="Historial de Beats" aria-busy={cargando}>
            <h2 className="mx-1 font-display text-[22px] uppercase tracking-[0.02em] text-texto-principal">
              Historial
            </h2>
            {cargando ? (
              <p className="mt-3 flex items-center justify-center gap-2 py-6 text-texto-secundario">
                <span className="girador" aria-hidden="true" />
                Cargando tu historial
              </p>
            ) : !tieneDatos ? (
              // Con red, sin nada guardado y con la carga fallida: el mismo
              // mensaje del aviso, en lugar del historial (spec §8.4).
              <div className="mt-3 flex flex-col items-center gap-3 rounded-[28px] border border-texto-principal/[0.08] bg-superficie px-5 py-6 text-center">
                <p className="text-texto-principal">No pudimos actualizar.</p>
                <button
                  type="button"
                  onClick={reintentar}
                  disabled={reintentando}
                  className="boton-secundario w-auto"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <div className="mt-3 overflow-hidden rounded-[28px] border border-texto-principal/[0.08] bg-superficie">
                {dias.map((dia) => (
                  <DiaHistorial
                    key={dia.dia_local}
                    dia={dia}
                    abierto={abiertos.has(dia.dia_local)}
                    alAlternar={() => historial.alternarDia(dia.dia_local)}
                  />
                ))}
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

          {/* Solo mientras no haya ningun escaneo: con el primero se retira y
              la explicacion queda en la pildora y en "Cómo ganar" (spec §8.1). */}
          {tieneDatos && resumen && !resumen.tiene_escaneos ? <EstadoInicial /> : null}

          <button
            type="button"
            onClick={() => setHojaAbierta(true)}
            aria-haspopup="dialog"
            className="boton-secundario boton--flecha text-[16px] font-bold"
          >
            Cómo ganar
            <CirculoFlecha tamano={40} />
          </button>

          <p className="text-center text-[13px] text-texto-secundario">
            Pronto podrás cambiarlos por entradas al concierto, merch y cursos.
          </p>
        </div>
      </main>

      <AnuncioVivo saldo={resumen?.saldo ?? null} />
      <TabBar />
      <HojaComoGanar abierta={hojaAbierta} alCerrar={cerrarHoja} />
    </>
  );
}
