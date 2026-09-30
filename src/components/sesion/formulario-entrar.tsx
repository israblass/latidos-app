"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { CampoTexto } from "@/components/registro/campo-texto";
import { crearClienteNavegador } from "@/lib/supabase/client";

/**
 * Formulario de /entrar: correo y contraseña contra Supabase Auth
 * (signInWithPassword), con el cliente de navegador de la app. Ese cliente
 * guarda la sesion en cookies, igual que la que deja la confirmacion del
 * registro, asi que Inicio, Beats y el middleware la ven sin nada mas.
 *
 * No decide a donde ir despues: manda a Inicio, y las guardias que ya existen
 * llevan al onboarding si no se vio, o a confirmar el correo si falta el
 * perfil.
 */

/** Sintaxis basica de correo: algo, arroba, dominio con punto. */
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MENSAJES = {
  credenciales: "El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.",
  sinConexion: "Sin conexión. Conéctate a internet e intenta de nuevo.",
  sinConfirmar: "Confirma tu correo para entrar. Busca el enlace que te enviamos.",
  otro: "No pudimos entrar. Intenta de nuevo.",
} as const;

function IconoOjo({ tachado }: { tachado: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {tachado ? <path d="M3 3l18 18" /> : null}
    </svg>
  );
}

export function FormularioEntrar() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);
  const [errorContrasena, setErrorContrasena] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campoCorreo = useRef<HTMLInputElement>(null);
  const campoContrasena = useRef<HTMLInputElement>(null);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    // Sin doble envio: un segundo toque mientras se espera no hace nada.
    if (enviando) return;

    const correoLimpio = correo.trim().toLowerCase();
    setErrorGeneral(null);

    if (!correoLimpio) {
      setErrorCorreo("Escribe tu correo.");
      campoCorreo.current?.focus();
      return;
    }
    if (!FORMATO_CORREO.test(correoLimpio)) {
      setErrorCorreo("Revisa tu correo: le falta algo.");
      campoCorreo.current?.focus();
      return;
    }
    if (!contrasena) {
      setErrorContrasena("Escribe tu contraseña.");
      campoContrasena.current?.focus();
      return;
    }

    // Sin red no se intenta: el mensaje llega al instante y dice lo que pasa.
    if (!navigator.onLine) {
      setErrorGeneral(MENSAJES.sinConexion);
      return;
    }

    setEnviando(true);
    try {
      const supabase = crearClienteNavegador();
      const { error } = await supabase.auth.signInWithPassword({
        email: correoLimpio,
        password: contrasena,
      });

      if (!error) {
        router.replace("/inicio");
        router.refresh();
        return;
      }

      // Correo inexistente y contraseña equivocada dan el mismo mensaje:
      // Supabase tampoco distingue, y asi no se revela quien tiene cuenta.
      // Se mira el codigo y, por si una version de Supabase no lo manda, el
      // texto que acompaña a esos dos errores desde siempre.
      if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) {
        setErrorGeneral(MENSAJES.credenciales);
      } else if (error.code === "email_not_confirmed" || /email not confirmed/i.test(error.message)) {
        setErrorGeneral(MENSAJES.sinConfirmar);
      }
      // status 0: la peticion ni siquiera llego (red caida con el telefono
      // creyendose conectado).
      else if (error.status === 0 || !navigator.onLine) setErrorGeneral(MENSAJES.sinConexion);
      else setErrorGeneral(MENSAJES.otro);
    } catch {
      setErrorGeneral(navigator.onLine ? MENSAJES.otro : MENSAJES.sinConexion);
    }
    setEnviando(false);
  }

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8 pt-4">
      <header>
        <Link
          href="/"
          aria-label="Volver a la bienvenida"
          className="-ml-2 flex h-12 w-12 items-center justify-center rounded-control text-texto-secundario transition-opacity active:opacity-60"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="titulo-pantalla mt-8">Entrar</h1>
        <p className="mt-2 text-texto-secundario">Con el correo y la contraseña de tu cuenta.</p>
      </header>

      <form noValidate onSubmit={entrar} className="mt-6 flex flex-1 flex-col">
        <div className="flex flex-col gap-5">
          <CampoTexto
            ref={campoCorreo}
            etiqueta="Correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={correo}
            error={errorCorreo}
            onChange={(e) => {
              setCorreo(e.target.value);
              setErrorCorreo(null);
            }}
          />

          <CampoTexto
            ref={campoContrasena}
            etiqueta="Contraseña"
            type={verContrasena ? "text" : "password"}
            autoComplete="current-password"
            value={contrasena}
            error={errorContrasena}
            onChange={(e) => {
              setContrasena(e.target.value);
              setErrorContrasena(null);
            }}
            accesorio={
              // Nombre fijo y el estado en aria-pressed: un lector de pantalla
              // anuncia "Mostrar contraseña, botón, presionado / no presionado".
              <button
                type="button"
                aria-label="Mostrar contraseña"
                aria-pressed={verContrasena}
                onClick={() => setVerContrasena((v) => !v)}
                className="flex h-12 w-12 items-center justify-center rounded-control text-texto-secundario active:opacity-60"
              >
                <IconoOjo tachado={verContrasena} />
              </button>
            }
          />
        </div>

        {/* role="alert": el lector de pantalla lo anuncia al aparecer, sin
            mover el foco, que se queda en el boton que se acaba de tocar. */}
        <p role="alert" className="mt-4 min-h-[1.25rem] text-sm text-error-texto">
          {errorGeneral}
        </p>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <button
            type="submit"
            // aria-disabled y no disabled: un boton deshabilitado suelta el foco.
            aria-disabled={enviando}
            className={`boton-primario ${enviando ? "opacity-60" : ""}`}
          >
            {enviando ? (
              <>
                <span className="girador mr-2" aria-hidden="true" />
                Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </button>

          <p className="text-center text-sm text-texto-secundario">¿Todavía no tienes cuenta?</p>
          <Link href="/registro/paso-1" className="boton-ghost">
            Crear cuenta
          </Link>
        </div>
      </form>
    </main>
  );
}
