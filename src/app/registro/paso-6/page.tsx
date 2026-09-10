"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CampoTexto } from "@/components/registro/campo-texto";
import { usePasoHabilitado } from "@/components/registro/guardia-paso";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { useRegistroForm } from "@/hooks/use-registro-form";
import { contrasenaSchema, primerError } from "@/lib/validacion/registro";

interface RespuestaError {
  error?: string;
  mensaje?: string;
  campos?: Record<string, string>;
}

interface RespuestaRegistro {
  usuario_id: string;
  sesion_token: string | null;
}

const MENSAJES_ERROR: Record<string, string> = {
  correo_ya_registrado: "Ese correo ya tiene una cuenta en Latidos.",
  datos_invalidos: "Revisa los datos e intenta de nuevo.",
  correo_no_enviado:
    "No pudimos enviarte el correo de confirmacion. Intenta mas tarde.",
};

export default function PasoContrasena() {
  const router = useRouter();
  const habilitado = usePasoHabilitado(6);
  const { datos } = useRegistroForm();
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function crearCuenta(evento: FormEvent) {
    evento.preventDefault();
    const mensaje = primerError(contrasenaSchema, contrasena);
    if (mensaje) {
      setError(mensaje);
      return;
    }

    setEnviando(true);
    setErrorGeneral(null);

    try {
      // Recien aqui se guarda todo el formulario, de una sola vez.
      const respuesta = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, contrasena }),
      });

      if (!respuesta.ok) {
        const detalle = (await respuesta.json()) as RespuestaError;
        setErrorGeneral(
          Object.values(detalle.campos ?? {})[0] ??
            MENSAJES_ERROR[detalle.error ?? ""] ??
            "No pudimos crear tu cuenta. Intenta de nuevo.",
        );
        setEnviando(false);
        return;
      }

      const { sesion_token } = (await respuesta.json()) as RespuestaRegistro;

      // Sin `sesion_token` la cuenta existe pero falta confirmar el correo, que
      // es lo normal con la confirmacion activada. Con token, la sesion ya
      // quedo iniciada y se puede seguir de largo.
      router.replace(
        sesion_token ? "/onboarding/pantalla-1" : "/registro/confirma-tu-correo",
      );
      router.refresh();
    } catch {
      setErrorGeneral("Revisa tu conexion e intenta de nuevo.");
      setEnviando(false);
    }
  }

  if (!habilitado) return null;

  return (
    <ProgresoRegistro paso={6} titulo="Crea tu contrasena">
      <form noValidate onSubmit={crearCuenta} className="flex flex-1 flex-col">
        <CampoTexto
          etiqueta="Contrasena"
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="Minimo 6 caracteres"
          ayuda="La usaras junto a tu correo para entrar."
          value={contrasena}
          error={error}
          onChange={(evento) => {
            setContrasena(evento.target.value);
            setError(null);
          }}
        />

        {errorGeneral ? (
          <p role="alert" className="mt-4 text-sm text-error-texto">
            {errorGeneral}
          </p>
        ) : null}

        <div className="mt-auto pt-8">
          <button type="submit" className="boton-primario" disabled={enviando}>
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </div>
      </form>
    </ProgresoRegistro>
  );
}
