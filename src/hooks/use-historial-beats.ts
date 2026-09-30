"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { leerHistorial } from "@/lib/beats/consultas";
import type { DiaHistorial, ResumenBeats } from "@/types/beats";

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
