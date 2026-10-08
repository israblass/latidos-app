"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { usePasoHabilitado } from "@/components/registro/guardia-paso";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { BotonVidrio } from "@/components/ui/boton-vidrio";
import { useRegistroForm } from "@/hooks/use-registro-form";
import { ETIQUETAS_TIPO_USUARIO, TIPOS_USUARIO, type TipoUsuario } from "@/types/usuario";

/**
 * Seleccion unica entre los tres tipos, autodeclarada: no hay campo adicional
 * que la sustente ni verificacion posterior (spec §10 suposicion 6).
 */
const DESCRIPCIONES: Record<TipoUsuario, string> = {
  estudiante_ucv: "Estudias actualmente en la UCV.",
  egresado: "Ya te graduaste en la UCV.",
  externo: "No estudiaste en la UCV pero quieres participar.",
};

/** Icono de cada opcion, en trazo navy dentro del circulo. */
const ICONOS: Record<TipoUsuario, string> = {
  // Birrete.
  estudiante_ucv: "M2 9l10-5 10 5-10 5-10-5z M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5 M22 9v6",
  // Diploma con sello.
  egresado: "M4 5h16v11H4z M8 9h8 M8 12h5 M15 16l1.5 4 1.5-1 1.5 1L18 16",
  // Persona.
  externo: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21c0-4 3.6-7 8-7s8 3 8 7",
};

export default function PasoTipoUsuario() {
  const router = useRouter();
  const habilitado = usePasoHabilitado(5);
  const { datos, actualizar } = useRegistroForm();
  const [seleccion, setSeleccion] = useState<TipoUsuario | null>(datos.tipo_usuario);

  function continuar() {
    if (!seleccion) return;
    actualizar({ tipo_usuario: seleccion });
    router.push("/registro/paso-6");
  }

  if (!habilitado) return null;

  return (
    <ProgresoRegistro paso={5} titulo="¿Qué eres en Latidos?" subtitulo="Elige la opción que te describe.">
      <div className="flex flex-1 flex-col">
        <div role="radiogroup" aria-label="Tipo de usuario" className="flex flex-col gap-3">
          {TIPOS_USUARIO.map((tipo) => {
            const activo = seleccion === tipo;
            return (
              <button
                key={tipo}
                type="button"
                role="radio"
                aria-checked={activo}
                onClick={() => setSeleccion(tipo)}
                // La elegida en vidrio amarillo con aro y check navy; las
                // demas, blancas y sin desenfoque (como mucho dos capas de
                // vidrio por pantalla: la elegida y el boton).
                className={`registro-opcion ${activo ? "vidrio vidrio-amarillo" : "superficie"}`}
              >
                <span aria-hidden="true" className={`registro-opcion-icono ${activo ? "circulo-navy" : ""}`}>
                  <svg
                    aria-hidden="true"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={ICONOS[tipo]} />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold text-texto-principal">
                    {ETIQUETAS_TIPO_USUARIO[tipo]}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-texto-secundario">
                    {DESCRIPCIONES[tipo]}
                  </span>
                </span>
                {activo ? (
                  <span
                    aria-hidden="true"
                    data-check=""
                    className="circulo-navy flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  >
                    <svg
                      aria-hidden="true"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-6">
          <BotonVidrio type="button" onClick={continuar} disabled={!seleccion}>
            Continuar
          </BotonVidrio>
        </div>
      </div>
    </ProgresoRegistro>
  );
}
