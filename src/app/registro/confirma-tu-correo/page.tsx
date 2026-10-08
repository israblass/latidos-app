"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { BannerAliado } from "@/components/registro/banner-aliado";
import { BotonVidrio } from "@/components/ui/boton-vidrio";
import { ILUSTRACIONES } from "@/lib/ilustraciones";

const MENSAJES_ERROR: Record<string, string> = {
  enlace_invalido: "Ese enlace ya venció. Pide uno nuevo desde tu correo.",
  enlace_incompleto: "El enlace llegó incompleto. Ábrelo de nuevo desde tu correo.",
  sesion_no_creada: "No pudimos iniciar tu sesión. Abre el enlace otra vez.",
  perfil_no_creado: "Confirmamos tu correo, pero faltaron tus datos. Escríbenos.",
};

/**
 * Pantalla posterior al paso 6 mientras el correo sigue sin confirmar, con el
 * lenguaje del registro (constitution §2, v2.10.2): circulos del pulso,
 * titulo en Anton, icono de correo y banner "Aliado".
 *
 * Reemplaza a la antigua `/registro/listo`. Sigue siendo temporal: en Fase 3,
 * una vez confirmado el correo, el destino pasa a ser el onboarding real.
 */
function Contenido() {
  const router = useRouter();
  const error = useSearchParams().get("error");
  const arte = ILUSTRACIONES.circulosPulsoBienvenida;

  return (
    <main className="registro">
      <div aria-hidden="true" className="registro-arte">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={arte.src} alt="" width={arte.ancho} height={arte.alto} decoding="async" />
      </div>

      <div className="mt-10 flex flex-col items-start">
        <span
          aria-hidden="true"
          className="circulo-navy flex h-16 w-16 items-center justify-center rounded-full"
        >
          <svg aria-hidden="true"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M4 7l8 6 8-6" />
          </svg>
        </span>
        <p className="etiqueta mt-6">Ya casi</p>
        <h1 className="registro-titulo mt-2">Revisa tu correo</h1>
        <p className="registro-subtitulo">
          Te enviamos un enlace para confirmar tu correo. Ábrelo para activar tu cuenta y entrar a Latidos.
        </p>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-error-texto">
            {MENSAJES_ERROR[error] ?? "Algo falló al confirmar tu correo. Intenta de nuevo."}
          </p>
        ) : (
          <p className="mt-4 text-sm text-texto-secundario">Si no lo ves, revisa la carpeta de spam.</p>
        )}
      </div>

      <div className="mt-6">
        <BannerAliado slot="registro-revisa-correo" />
      </div>

      <div className="mt-auto pt-6">
        <BotonVidrio type="button" tono="blanco" onClick={() => router.push("/")}>
          Volver al inicio
        </BotonVidrio>
      </div>
    </main>
  );
}

export default function ConfirmaTuCorreo() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  );
}
