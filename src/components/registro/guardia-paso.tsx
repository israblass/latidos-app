"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useRegistroForm } from "@/hooks/use-registro-form";

/**
 * Devuelve true cuando el paso puede renderizarse.
 *
 * Como el formulario vive solo en memoria, recargar la app o entrar directo
 * a un paso intermedio deja el estado vacio: en ese caso se devuelve al
 * paso 1 (spec, criterio de aceptacion 6).
 */
export function usePasoHabilitado(paso: number): boolean {
  const router = useRouter();
  const { ultimoPasoCompletado } = useRegistroForm();
  const habilitado = ultimoPasoCompletado >= paso - 1;

  useEffect(() => {
    if (!habilitado) {
      router.replace("/registro/paso-1");
    }
  }, [habilitado, router]);

  return habilitado;
}
