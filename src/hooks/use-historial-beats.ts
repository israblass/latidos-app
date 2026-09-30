"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useMovimientosEnVivo } from "@/hooks/use-movimientos-en-vivo";
import { escribirCache } from "@/lib/beats/cache";
import { leerHistorial, leerMarca, leerResumen } from "@/lib/beats/consultas";
import { insertarMovimiento } from "@/lib/beats/insertar-movimiento";
import type {
  CacheBeats,
  DiaHistorial,
  Movimiento,
  MovimientoBeats,
  ResumenBeats,
} from "@/types/beats";

/**
 * Estado de la pantalla de Beats: saldo, historial por dias y que dias estan
 * abiertos (T023).
 *
 * Arranca cuando el guardia entrega el resumen y trae los 7 dias mas
 * recientes. El mas reciente viene abierto; los demas cerrados, y abrir uno no
 * cierra otro (spec §7 pasos 5 y 7). Los lotes siguientes llegan con
 * `cargarMas`, que la pantalla llama al acercarse al final de la lista.
 *
 * En vivo (T035): cada movimiento nuevo del libro entra en su dia (o crea el
 * dia arriba y abierto), y el saldo se relee de la base en vez de sumarse
 * aqui, para que el numero sea siempre el autoritativo.
 *
 * Sin conexion (T040): `hidratar` pinta al instante la copia guardada en el
 * dispositivo, y cada carga exitosa o evento en vivo la vuelve a escribir.
 * `origen` dice si lo que se ve salio de la red en esta visita o de la copia,
 * y `actualizadoEn` de cuando es, para el aviso "Asi estaban tus Beats a las".
 */

export type EstadoHistorial = "esperando" | "cargando" | "listo" | "error";
export type OrigenDatos = "ninguno" | "cache" | "red";

export function useHistorialBeats({
  resumenInicial,
  usuarioId,
}: {
  resumenInicial: ResumenBeats | null;
  /** De la sesion local: existe aunque no haya red. */
  usuarioId: string | null;
}) {
  const [resumen, setResumen] = useState<ResumenBeats | null>(resumenInicial);
  const [dias, setDias] = useState<DiaHistorial[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoHistorial>("esperando");
  const [cargandoMas, setCargandoMas] = useState(false);
  const [errorAlCargarMas, setErrorAlCargarMas] = useState(false);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [origen, setOrigen] = useState<OrigenDatos>("ninguno");
  const [actualizadoEn, setActualizadoEn] = useState<string | null>(null);

  // Una carga de mas en vuelo a la vez: el observador del final de la lista
  // puede disparar varias veces seguidas mientras la primera no termina.
  const pidiendoMas = useRef(false);

  // Lo ultimo de dias y hayMas, para los eventos en vivo, que llegan fuera
  // del ciclo de render.
  const diasActuales = useRef<DiaHistorial[]>([]);
  diasActuales.current = dias;
  const hayMasActual = useRef(false);
  hayMasActual.current = hayMas;

  // Marcas ya resueltas por id: un escaneo en vivo trae marca_id, no el nombre.
  const marcas = useRef(new Map<string, { nombre: string; logo_url: string | null }>());

  useEffect(() => {
    if (resumenInicial) setResumen(resumenInicial);
  }, [resumenInicial]);

  /** Pinta la copia guardada mientras llegan los datos frescos. */
  const hidratar = useCallback((cache: CacheBeats) => {
    setResumen((actual) =>
      actual ?? {
        saldo: cache.saldo,
        tiene_escaneos: cache.tiene_escaneos,
        onboarding_visto: cache.onboarding_visto,
      },
    );
    setDias((actuales) => (actuales.length ? actuales : cache.dias));
    setHayMas(cache.hay_mas);
    setCursor(cache.siguiente_cursor);
    setAbiertos((actuales) =>
      actuales.size ? actuales : new Set(cache.dias[0] ? [cache.dias[0].dia_local] : []),
    );
    setOrigen((actual) => (actual === "red" ? actual : "cache"));
    setActualizadoEn((actual) => actual ?? cache.actualizado_en);
  }, []);

  const cargarInicio = useCallback(async () => {
    setEstado("cargando");
    try {
      const pagina = await leerHistorial();
      setDias(pagina.dias);
      setHayMas(pagina.hay_mas);
      setCursor(pagina.siguiente_cursor);
      setAbiertos(new Set(pagina.dias[0] ? [pagina.dias[0].dia_local] : []));
      setOrigen("red");
      setActualizadoEn(new Date().toISOString());
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    if (resumenInicial) void cargarInicio();
  }, [resumenInicial, cargarInicio]);

  // La copia se reescribe con cada dato fresco: carga, lote nuevo o evento en
  // vivo. Lo que vino de la propia copia no se vuelve a guardar.
  useEffect(() => {
    if (!usuarioId || origen !== "red" || !resumen || !actualizadoEn) return;
    escribirCache({
      usuario_id: usuarioId,
      saldo: resumen.saldo,
      tiene_escaneos: resumen.tiene_escaneos,
      onboarding_visto: resumen.onboarding_visto,
      dias,
      hay_mas: hayMas,
      siguiente_cursor: cursor,
      actualizado_en: actualizadoEn,
    });
  }, [usuarioId, origen, resumen, dias, hayMas, cursor, actualizadoEn]);

  const cargarMas = useCallback(async () => {
    // Sin datos frescos (se esta viendo la copia sin red) no se piden dias
    // anteriores: la spec §8.2 lo deja para cuando vuelva la señal.
    if (!hayMas || !cursor || pidiendoMas.current || origen !== "red") return;
    pidiendoMas.current = true;
    setCargandoMas(true);
    setErrorAlCargarMas(false);
    try {
      const pagina = await leerHistorial(cursor);
      setDias((previos) => [...previos, ...pagina.dias]);
      setHayMas(pagina.hay_mas);
      setCursor(pagina.siguiente_cursor);
    } catch {
      setErrorAlCargarMas(true);
    } finally {
      pidiendoMas.current = false;
      setCargandoMas(false);
    }
  }, [hayMas, cursor, origen]);

  const alLlegarMovimiento = useCallback(async (fila: MovimientoBeats) => {
    let marca: Movimiento["marca"] = null;
    if (fila.marca_id) {
      marca = marcas.current.get(fila.marca_id) ?? null;
      if (!marca) {
        marca = await leerMarca(fila.marca_id).catch(() => null);
        if (marca) marcas.current.set(fila.marca_id, marca);
      }
    }

    const movimiento: Movimiento = {
      id: fila.id,
      tipo: fila.tipo,
      beats: fila.beats,
      ocurrido_en: fila.ocurrido_en,
      marca,
    };
    const resultado = insertarMovimiento(
      diasActuales.current,
      fila.dia_local,
      movimiento,
      hayMasActual.current,
    );
    if (resultado) {
      diasActuales.current = resultado.dias;
      setDias(resultado.dias);
      if (resultado.diaNuevo) {
        setAbiertos((previos) => new Set(previos).add(fila.dia_local));
      }
    }

    // El saldo se relee: si llegan dos eventos casi juntos, sumar aqui podria
    // contar uno dos veces o perderlo.
    try {
      const actual = await leerResumen();
      if (actual) {
        setResumen(actual);
        setActualizadoEn(new Date().toISOString());
      }
    } catch {
      // Sin red en este momento: el numero se pone al dia en la proxima carga.
    }
  }, []);

  // Solo con datos frescos: sin red no hay canal, y suscribirse sobre la copia
  // mezclaria eventos nuevos con dias viejos.
  useMovimientosEnVivo(origen === "red" ? usuarioId : null, alLlegarMovimiento);

  const alternarDia = useCallback((dia: string) => {
    setAbiertos((previos) => {
      const siguientes = new Set(previos);
      if (siguientes.has(dia)) siguientes.delete(dia);
      else siguientes.add(dia);
      return siguientes;
    });
  }, []);

  return {
    resumen,
    dias,
    hayMas,
    estado,
    origen,
    actualizadoEn,
    cargandoMas,
    errorAlCargarMas,
    abiertos,
    alternarDia,
    cargarMas,
    hidratar,
    recargar: cargarInicio,
  };
}
