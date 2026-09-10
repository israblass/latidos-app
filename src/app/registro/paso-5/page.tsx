"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { usePasoHabilitado } from "@/components/registro/guardia-paso";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { useRegistroForm } from "@/hooks/use-registro-form";
import {
  ETIQUETAS_TIPO_USUARIO,
  TIPOS_USUARIO,
  type TipoUsuario,
} from "@/types/usuario";

/**
 * Seleccion unica entre los tres tipos, autodeclarada: no hay campo adicional
 * que la sustente ni verificacion posterior (spec §10 suposicion 6).
 */
const DESCRIPCIONES: Record<TipoUsuario, string> = {
  estudiante_ucv: "Estudias actualmente en la UCV.",
  egresado: "Ya te graduaste en la UCV.",
  externo: "No estudiaste en la UCV pero quieres participar.",
};

export default function PasoTipoUsuario() {
  const router = useRouter();
  const habilitado = usePasoHabilitado(5);
  const { datos, actualizar } = useRegistroForm();
  const [seleccion, setSeleccion] = useState<TipoUsuario | null>(
    datos.tipo_usuario,
  );

  function continuar() {
    if (!seleccion) return;
    actualizar({ tipo_usuario: seleccion });
    router.push("/registro/paso-6");
  }

  if (!habilitado) return null;

  return (
    <ProgresoRegistro paso={5} titulo="Que eres en Latidos?">
      <div className="flex flex-1 flex-col">
        <div
          role="radiogroup"
          aria-label="Tipo de usuario"
          className="flex flex-col gap-3"
        >
          {TIPOS_USUARIO.map((tipo) => {
            const activo = seleccion === tipo;
            return (
              <button
                key={tipo}
                type="button"
                role="radio"
                aria-checked={activo}
                onClick={() => setSeleccion(tipo)}
                className={`tarjeta min-h-touch text-left transition-colors ${
                  activo ? "border-primario" : ""
                }`}
              >
                <span className="block text-[16px] font-medium text-texto-principal">
                  {ETIQUETAS_TIPO_USUARIO[tipo]}
                </span>
                <span className="mt-1 block text-xs text-texto-secundario">
                  {DESCRIPCIONES[tipo]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={continuar}
            disabled={!seleccion}
            className="boton-primario"
          >
            Continuar
          </button>
        </div>
      </div>
    </ProgresoRegistro>
  );
}
