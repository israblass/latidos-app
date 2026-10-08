"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { CampoTexto } from "@/components/registro/campo-texto";
import { usePasoHabilitado } from "@/components/registro/guardia-paso";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { BotonVidrio } from "@/components/ui/boton-vidrio";
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
  correo_no_enviado: "No pudimos enviarte el correo de confirmación. Intenta más tarde.",
};

const NIVELES = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"] as const;

/**
 * Fuerza de la contrasena, de 0 a 4, solo para el medidor: la regla que
 * decide si se acepta sigue siendo contrasenaSchema.
 */
function fuerza(clave: string): number {
  if (clave.length < 6) return clave.length ? 1 : 0;
  let puntos = 1;
  if (clave.length >= 10) puntos++;
  if (/[a-z]/i.test(clave) && /\d/.test(clave)) puntos++;
  if (/[^a-z0-9]/i.test(clave) || (/[a-z]/.test(clave) && /[A-Z]/.test(clave))) puntos++;
  return Math.min(puntos, 4);
}

export default function PasoContrasena() {
  const router = useRouter();
  const habilitado = usePasoHabilitado(6);
  const { datos } = useRegistroForm();
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [visible, setVisible] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  // Guarda sincrona contra el doble envio: el estado tarda un render en
  // llegar, y dos toques seguidos alcanzarian a pasar los dos.
  const enEnvio = useRef(false);
  const valida = primerError(contrasenaSchema, contrasena) === null;
  const nivel = fuerza(contrasena);

  async function crearCuenta(evento: FormEvent) {
    evento.preventDefault();
    if (enEnvio.current) return;
    const mensaje = primerError(contrasenaSchema, contrasena);
    if (mensaje) {
      setError(mensaje);
      return;
    }

    enEnvio.current = true;
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
        enEnvio.current = false;
        setEnviando(false);
        return;
      }

      const { sesion_token } = (await respuesta.json()) as RespuestaRegistro;

      // Sin `sesion_token` la cuenta existe pero falta confirmar el correo, que
      // es lo normal con la confirmacion activada. Con token, la sesion ya
      // quedo iniciada y se puede seguir de largo.
      router.replace(sesion_token ? "/onboarding/pantalla-1" : "/registro/confirma-tu-correo");
      router.refresh();
    } catch {
      setErrorGeneral("Revisa tu conexión e intenta de nuevo.");
      enEnvio.current = false;
      setEnviando(false);
    }
  }

  // Con el boton deshabilitado el navegador no envia el formulario con Enter:
  // se envia a mano, y si la contrasena no vale, crearCuenta muestra el error.
  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    formulario.current?.requestSubmit();
  }

  if (!habilitado) return null;

  return (
    <ProgresoRegistro
      paso={6}
      titulo="Crea tu contraseña"
      subtitulo="La usarás junto a tu correo para entrar."
    >
      <form ref={formulario} noValidate onSubmit={crearCuenta} className="flex flex-1 flex-col">
        <div className="vidrio registro-tarjeta">
          <CampoTexto
            etiqueta="Contraseña"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            autoFocus
            placeholder="Mínimo 6 caracteres"
            value={contrasena}
            error={error}
            onKeyDown={alTeclear}
            onChange={(evento) => {
              setContrasena(evento.target.value);
              setError(null);
            }}
            accesorio={
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={visible}
                className="flex h-12 w-12 items-center justify-center text-texto-secundario"
              >
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
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {visible ? null : <path d="M4 4l16 16" />}
                </svg>
              </button>
            }
          />
          <div>
            <div className="medidor-fuerza" aria-hidden="true" data-medidor-fuerza={nivel}>
              {[1, 2, 3, 4].map((tramo) => (
                <span key={tramo} data-lleno={tramo <= nivel ? "" : undefined} />
              ))}
            </div>
            <p className="mt-2 text-xs text-texto-secundario" aria-live="polite">
              {contrasena ? `Seguridad: ${NIVELES[nivel]}` : "Usa letras y números para hacerla más segura."}
            </p>
          </div>
        </div>

        {errorGeneral ? (
          <p role="alert" className="mt-4 text-sm text-error-texto">
            {errorGeneral}
          </p>
        ) : null}

        <div className="mt-auto pt-6">
          <BotonVidrio type="submit" disabled={!valida} cargando={enviando}>
            {enviando ? "Creando cuenta…" : "Crear cuenta"}
          </BotonVidrio>
        </div>
      </form>
    </ProgresoRegistro>
  );
}
