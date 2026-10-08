"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";

import { useTecladoAbierto } from "@/hooks/use-teclado-abierto";
import { ILUSTRACIONES } from "@/lib/ilustraciones";
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
 *
 * Diseño (constitution §2, v2.13.0, opcion A "heroe"): circulos del pulso y
 * degradado de marca, el corazon con audifonos, "Qué bueno verte de nuevo",
 * una sola tarjeta de vidrio con correo y contraseña, "Entrar" tap de vidrio
 * amarillo (sin circulo: no se desliza) y "Crear cuenta" de vidrio blanco.
 * Capas con desenfoque: la tarjeta y "Entrar"; el boton atras y "Crear
 * cuenta" son .vidrio-plano. Con el teclado abierto se va el corazon y los
 * botones suben bajo la tarjeta, para que campos y "Entrar" se alcancen.
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
  const teclado = useTecladoAbierto();
  const id = useId();
  const corazon = ILUSTRACIONES.corazonAudifonosEntrar;
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);
  const [errorContrasena, setErrorContrasena] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campoCorreo = useRef<HTMLInputElement>(null);
  const campoContrasena = useRef<HTMLInputElement>(null);

  // "Entrar" se apaga hasta que los dos campos tengan algo.
  const incompleto = !correo || !contrasena;

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    // Sin doble envio: un segundo toque mientras se espera no hace nada. Con
    // un campo vacio el boton esta apagado y Enter tampoco envia.
    if (enviando || incompleto) return;

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

  const idCorreo = `${id}-correo`;
  const idContrasena = `${id}-contrasena`;
  const errorCampo = errorCorreo ?? errorContrasena;

  return (
    <main className="entrar" data-teclado={teclado ? "" : undefined}>
      <div aria-hidden="true" className="fondo-inicio" />
      <div aria-hidden="true" className="registro-arte">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ILUSTRACIONES.circulosPulsoBienvenida.src}
          alt=""
          width={ILUSTRACIONES.circulosPulsoBienvenida.ancho}
          height={ILUSTRACIONES.circulosPulsoBienvenida.alto}
          decoding="async"
        />
      </div>

      <Link href="/" aria-label="Volver a la bienvenida" className="vidrio vidrio-plano entrar-atras">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>

      <header className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={corazon.src}
          alt=""
          width={corazon.ancho}
          height={corazon.alto}
          decoding="async"
          data-heroe-entrar=""
          className="entrar-heroe"
        />
        <h1 className="entrar-titulo">
          <span className="block">Qué bueno verte</span> <span className="block">de nuevo</span>
        </h1>
      </header>

      <form noValidate onSubmit={entrar} className="entrar-formulario">
        <div className="vidrio entrar-tarjeta">
          <div className="entrar-fila">
            <label htmlFor={idCorreo} className="entrar-etiqueta">
              Correo
            </label>
            <input
              ref={campoCorreo}
              id={idCorreo}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={correo}
              aria-invalid={errorCorreo ? true : undefined}
              aria-describedby={errorCorreo ? `${id}-error` : undefined}
              onChange={(e) => {
                setCorreo(e.target.value);
                setErrorCorreo(null);
              }}
              className="entrar-campo"
            />
          </div>
          <div className="entrar-fila">
            <label htmlFor={idContrasena} className="entrar-etiqueta">
              Contraseña
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={campoContrasena}
                id={idContrasena}
                type={verContrasena ? "text" : "password"}
                autoComplete="current-password"
                value={contrasena}
                aria-invalid={errorContrasena ? true : undefined}
                aria-describedby={errorContrasena ? `${id}-error` : undefined}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  setErrorContrasena(null);
                }}
                className="entrar-campo"
              />
              {/* Nombre fijo y el estado en aria-pressed: un lector de pantalla
                  anuncia "Mostrar contraseña, botón, presionado / no presionado". */}
              <button
                type="button"
                aria-label="Mostrar contraseña"
                aria-pressed={verContrasena}
                onClick={() => setVerContrasena((v) => !v)}
                className="-mr-3 -my-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-texto-secundario active:opacity-60"
              >
                <IconoOjo tachado={verContrasena} />
              </button>
            </div>
          </div>
        </div>

        {errorCampo ? (
          <p id={`${id}-error`} className="mt-3 px-2 text-sm text-error-texto">
            {errorCampo}
          </p>
        ) : null}

        {/* role="alert": el lector de pantalla lo anuncia al aparecer, sin
            mover el foco, que se queda en el boton que se acaba de tocar. */}
        <p role="alert" className="mt-3 min-h-[1.25rem] px-2 text-sm text-error-texto">
          {errorGeneral}
        </p>

        <div className="entrar-acciones">
          <button
            type="submit"
            // aria-disabled y no disabled: un boton deshabilitado suelta el foco.
            aria-disabled={enviando || incompleto}
            aria-busy={enviando || undefined}
            data-boton-vidrio=""
            className="vidrio vidrio-amarillo boton-vidrio"
          >
            <span>{enviando ? "Entrando…" : "Entrar"}</span>
            {enviando ? null : (
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>

          <p className="text-center text-[15px] text-texto-secundario">¿Todavía no tienes cuenta?</p>
          <Link href="/registro/paso-1" className="vidrio vidrio-plano boton-vidrio">
            Crear cuenta
          </Link>
        </div>
      </form>
    </main>
  );
}
