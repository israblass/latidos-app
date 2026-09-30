"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { leerHistorial, leerMarca, leerResumen } from "@/lib/beats/consultas";
import { insertarMovimiento } from "@/lib/beats/insertar-movimiento";
import { leerUsuarioDeSesion, useMovimientosEnVivo } from "@/hooks/use-movimientos-en-vivo";
import type { DiaHistorial, Movimiento, MovimientoBeats, ResumenBeats } from "@/types/beats";

/**
 * Estado de la pantalla de Beats: saldo, historial por dias y que dias estan
 * abiertos (T023).
 *
 * Arranca cuando el guardia entrega el resumen y trae los 7 dias mas
 * recientes. El mas reciente viene abierto; los demas cerrados, y abrir uno no
 * cierra otro (spec §7 pasos 5 y 7). Los lotes siguientes llegan con
 * `cargarMas`, que la pantalla llama al acercarse al final de la lista.
 *
 * Expone `estado` y `errorAlCargarMas` para que las fases de en vivo y sin
 * conexion se apoyen aqui en vez de duplicar la carga.
 *
 * En vivo (T035): cada movimiento nuevo del libro entra en su dia (o crea el
 * dia arriba y abierto), y el saldo se relee de la base en vez de sumarse
 * aqui, para que el numero sea siempre el autoritativo.
 */

export type EstadoHistorial = "esperando" | "cargando" | "listo" | "error";

export function useHistorialBeats(resumenInicial: ResumenBeats | null) {
  const [resumen, setResumen] = useState<ResumenBeats | null>(resumenInicial);
  const [dias, setDias] = useState<DiaHistorial[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoHistorial>("esperando");
  const [cargandoMas, setCargandoMas] = useState(false);
  const [errorAlCargarMas, setErrorAlCargarMas] = useState(false);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

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
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  useEffect(() => {
    if (resumenInicial) setResumen(resumenInicial);
  }, [resumenInicial]);

  const cargarInicio = useCallback(async () => {
    setEstado("cargando");
    try {
      const pagina = await leerHistorial();
      setDias(pagina.dias);
      setHayMas(pagina.hay_mas);
      setCursor(pagina.siguiente_cursor);
      setAbiertos(new Set(pagina.dias[0] ? [pagina.dias[0].dia_local] : []));
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    if (resumenInicial) void cargarInicio();
  }, [resumenInicial, cargarInicio]);

  const cargarMas = useCallback(async () => {
    if (!hayMas || !cursor || pidiendoMas.current) return;
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
  }, [hayMas, cursor]);

  useEffect(() => {
    if (!resumenInicial) return;
    let vigente = true;
    void leerUsuarioDeSesion().then((id) => {
      if (vigente) setUsuarioId(id);
    });
    return () => {
      vigente = false;
    };
  }, [resumenInicial]);

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
      if (actual) setResumen(actual);
    } catch {
      // Sin red en este momento: el numero se pone al dia en la proxima carga.
    }
  }, []);

  useMovimientosEnVivo(usuarioId, alLlegarMovimiento);

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
    setResumen,
    dias,
    setDias,
    hayMas,
    estado,
    cargandoMas,
    errorAlCargarMas,
    abiertos,
    setAbiertos,
    alternarDia,
    cargarMas,
    recargar: cargarInicio,
  };
}
