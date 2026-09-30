"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DiaHistorial } from "@/components/beats/dia-historial";
import { EstadoInicial } from "@/components/beats/estado-inicial";
import { HojaComoGanar } from "@/components/beats/hoja-como-ganar";
import { AnuncioVivo } from "@/components/beats/anuncio-vivo";
import { ContadorBeatsVivo } from "@/components/beats/contador-beats-vivo";
import { TabBar } from "@/components/navegacion/tab-bar";
import { AvisoEstado } from "@/components/beats/aviso-estado";
import { SinConexionBeats } from "@/components/beats/sin-conexion-beats";
import { useConexion } from "@/hooks/use-conexion";
import { useGuardiaBeats } from "@/hooks/use-guardia-beats";
import { leerUsuarioDeSesion } from "@/hooks/use-movimientos-en-vivo";
import { borrarCachesAjenas, borrarTodasLasCaches, leerCache } from "@/lib/beats/cache";
import { useHistorialBeats } from "@/hooks/use-historial-beats";

/**
 * Pantalla de Beats (T020): saldo, recordatorio del canje e historial por dias.
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
        <main className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
          <h1 className="titulo-pantalla">Beats</h1>
          <SinConexionBeats />
        </main>
        <TabBar />
      </>
    );
  }

  return (
    <>
      <main className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
        {tieneDatos && !enLinea ? (
          <AvisoEstado tipo="sin-conexion" actualizadoEn={historial.actualizadoEn} />
        ) : tieneDatos && fallo ? (
          <AvisoEstado tipo="error" alReintentar={reintentar} reintentando={reintentando} />
        ) : null}

        <header className="flex min-h-touch items-center justify-between gap-3">
          <h1 className="titulo-pantalla">Beats</h1>
          {/* Ghost azul a la derecha del titulo (spec §10.1). */}
          <button
            type="button"
            onClick={() => setHojaAbierta(true)}
            aria-haspopup="dialog"
            className="boton-ghost -mr-4"
          >
            ¿Cómo gano Beats?
          </button>
        </header>

        <section aria-label="Tu balance de Beats" className="mt-4">
          <div className="vidrio-medio px-6 py-8 text-center">
            {resumen ? (
              // Sin animacion de entrada (spec §10.11): el numero aparece
              // directo. Solo se anima si cambia con la pantalla abierta.
              <ContadorBeatsVivo valor={resumen.saldo} />
            ) : (
              <div className="flex min-h-[132px] items-center justify-center text-texto-secundario">
                {fallo ? null : <span className="girador" aria-hidden="true" />}
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
          ) : !tieneDatos ? (
            // Con red, sin nada guardado y con la carga fallida: el mismo
            // mensaje del aviso, en lugar del historial (spec §8.4).
            <div className="vidrio-medio flex flex-col items-center gap-3 px-5 py-6 text-center">
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

        {/* Solo mientras no haya ningun escaneo: con el primero se retira y la
            explicacion queda en el boton de arriba (spec §8.1). */}
        {tieneDatos && resumen && !resumen.tiene_escaneos ? <EstadoInicial /> : null}
      </main>

      <AnuncioVivo saldo={resumen?.saldo ?? null} />
      <TabBar />
      <HojaComoGanar abierta={hojaAbierta} alCerrar={cerrarHoja} />
    </>
  );
}
