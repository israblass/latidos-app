"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { TipoUsuario } from "@/types/usuario";

/**
 * Estado del registro por pasos.
 *
 * Vive UNICAMENTE en memoria (React state): no se toca localStorage,
 * sessionStorage ni cookies. Es intencional (spec §9 regla 1 y flujo
 * alternativo 6): si la persona cierra la app a mitad del registro pierde
 * lo avanzado y vuelve a empezar desde el paso 1. El unico guardado ocurre
 * al confirmar el paso 6.
 */

export interface EstadoRegistro {
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  tipo_usuario: TipoUsuario | null;
}

const ESTADO_INICIAL: EstadoRegistro = {
  cedula: "",
  nombre: "",
  apellido: "",
  telefono: "",
  correo: "",
  tipo_usuario: null,
};

interface ContextoRegistro {
  datos: EstadoRegistro;
  actualizar: (parcial: Partial<EstadoRegistro>) => void;
  limpiar: () => void;
  /** Ultimo paso (1-6) para el que ya hay datos validos en memoria. */
  ultimoPasoCompletado: number;
}

const RegistroContext = createContext<ContextoRegistro | null>(null);

function calcularUltimoPasoCompletado(datos: EstadoRegistro): number {
  if (!datos.cedula) return 0;
  if (!datos.nombre || !datos.apellido) return 1;
  if (!datos.telefono) return 2;
  if (!datos.correo) return 3;
  if (!datos.tipo_usuario) return 4;
  return 5;
}

export function ProveedorRegistro({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<EstadoRegistro>(ESTADO_INICIAL);

  const actualizar = useCallback((parcial: Partial<EstadoRegistro>) => {
    setDatos((previo) => ({ ...previo, ...parcial }));
  }, []);

  const limpiar = useCallback(() => setDatos(ESTADO_INICIAL), []);

  const valor = useMemo<ContextoRegistro>(
    () => ({
      datos,
      actualizar,
      limpiar,
      ultimoPasoCompletado: calcularUltimoPasoCompletado(datos),
    }),
    [datos, actualizar, limpiar],
  );

  return createElement(RegistroContext.Provider, { value: valor }, children);
}

export function useRegistroForm(): ContextoRegistro {
  const contexto = useContext(RegistroContext);
  if (!contexto) {
    throw new Error("useRegistroForm debe usarse dentro de ProveedorRegistro");
  }
  return contexto;
}
