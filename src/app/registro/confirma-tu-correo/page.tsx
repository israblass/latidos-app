"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const MENSAJES_ERROR: Record<string, string> = {
  enlace_invalido: "Ese enlace ya vencio. Pide uno nuevo desde tu correo.",
  enlace_incompleto: "El enlace llego incompleto. Abrelo de nuevo desde tu correo.",
  sesion_no_creada: "No pudimos iniciar tu sesion. Abre el enlace otra vez.",
  perfil_no_creado: "Confirmamos tu correo pero faltaron tus datos. Escribenos.",
};

/**
 * Pantalla posterior al paso 6 mientras el correo sigue sin confirmar.
 *
 * Reemplaza a la antigua `/registro/listo`. Sigue siendo temporal: en Fase 3,
 * una vez confirmado el correo, el destino pasa a ser el onboarding real.
 */
function Contenido() {
  const error = useSearchParams().get("error");

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 pb-8 pt-4">
      <p className="etiqueta">Ya casi</p>
      <h1 className="titulo-pantalla mt-3">Confirma tu correo</h1>
      <p className="mt-4 text-texto-secundario">
        Te enviamos un enlace. Abrelo para activar tu cuenta y entrar a Latidos.
      </p>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-error-texto">
          {MENSAJES_ERROR[error] ??
            "Algo fallo al confirmar tu correo. Intenta de nuevo."}
        </p>
      ) : (
        <p className="mt-6 text-sm text-texto-secundario">
          Si no lo ves, revisa la carpeta de spam.
        </p>
      )}

      <div className="mt-10">
        <Link href="/" className="boton-secundario">
          Volver al inicio
        </Link>
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
