"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

import { Avatar } from "@/components/ui/avatar";
import { BotonVidrio } from "@/components/ui/boton-vidrio";
import { HojaInferior } from "@/components/ui/hoja-inferior";
import { FallaFoto, MENSAJES_ERROR_FOTO, procesarFoto, type ErrorFoto } from "@/lib/avatar";
import { guardarFoto, quitarFoto } from "@/lib/perfil/foto";

type Vista = "menu" | "vista-previa" | "quitar";

/** Una foto ya procesada (512x512) y su URL local para mostrarla. */
interface Elegida {
  foto: Blob;
  url: string;
}

const MENSAJE_QUITAR = "No pudimos quitar tu foto. Inténtalo de nuevo.";

/**
 * Avatar del Perfil con foto (constitution §2, v2.12.0). Es un boton "Cambiar
 * foto de perfil" con un indicador de camara (circulo navy, no es un boton
 * deslizable) que abre la hoja "Foto de perfil":
 *
 * - menu: "Elegir o tomar foto" (input de archivo oculto: en iOS el selector
 *   nativo ofrece camara y galeria), "Quitar foto" si hay una, "Cancelar".
 * - vista previa: la foto ya recortada en un circulo de 160px, "Guardar" y
 *   "Elegir otra". Mientras sube, "Guardando…" y sin doble envio.
 * - quitar: "¿Quitar tu foto?" con su confirmacion.
 *
 * Los errores no pierden la seleccion: la vista previa sigue ahi para volver
 * a intentar.
 */
export function FotoPerfil({
  usuarioId,
  iniciales,
  rutaInicial,
}: {
  usuarioId: string;
  iniciales: string;
  rutaInicial: string | null;
}) {
  const [ruta, setRuta] = useState(rutaInicial);
  // La foto recien guardada se ve al instante, sin esperar la URL firmada.
  const [local, setLocal] = useState<string | null>(null);
  const [abierta, setAbierta] = useState(false);
  const [vista, setVista] = useState<Vista>("menu");
  const [elegida, setElegida] = useState<Elegida | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState(false);
  const enCurso = useRef(false);
  const entrada = useRef<HTMLInputElement>(null);

  // Las URL locales se sueltan cuando dejan de usarse.
  useEffect(() => () => (elegida ? URL.revokeObjectURL(elegida.url) : undefined), [elegida]);
  useEffect(() => () => (local ? URL.revokeObjectURL(local) : undefined), [local]);

  const cerrar = useCallback(() => {
    if (enCurso.current) return;
    setAbierta(false);
    setVista("menu");
    setElegida(null);
    setError(null);
  }, []);

  const abrirSelector = () => {
    setError(null);
    entrada.current?.click();
  };

  async function alElegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    // Se limpia para que elegir el mismo archivo otra vez tambien avise.
    evento.target.value = "";
    if (!archivo) return;
    try {
      const foto = await procesarFoto(archivo);
      setElegida({ foto, url: URL.createObjectURL(foto) });
      setVista("vista-previa");
      setError(null);
    } catch (e) {
      // La seleccion anterior (si habia) se queda.
      setError(MENSAJES_ERROR_FOTO[e instanceof FallaFoto ? e.codigo : ("ilegible" as ErrorFoto)]);
    }
  }

  async function guardar() {
    if (!elegida || enCurso.current) return;
    enCurso.current = true;
    setOcupada(true);
    setError(null);
    try {
      const nueva = await guardarFoto({ usuarioId, foto: elegida.foto, rutaAnterior: ruta });
      setLocal(URL.createObjectURL(elegida.foto));
      setRuta(nueva);
      enCurso.current = false;
      setOcupada(false);
      cerrar();
    } catch (e) {
      enCurso.current = false;
      setOcupada(false);
      setError(MENSAJES_ERROR_FOTO[e instanceof FallaFoto ? e.codigo : "servidor"]);
    }
  }

  async function quitar() {
    if (!ruta || enCurso.current) return;
    enCurso.current = true;
    setOcupada(true);
    setError(null);
    try {
      await quitarFoto({ usuarioId, ruta });
      setRuta(null);
      setLocal(null);
      enCurso.current = false;
      setOcupada(false);
      cerrar();
    } catch (e) {
      enCurso.current = false;
      setOcupada(false);
      setError(e instanceof FallaFoto && e.codigo === "sin-conexion" ? e.message : MENSAJE_QUITAR);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Cambiar foto de perfil"
        onClick={() => setAbierta(true)}
        className="perfil-avatar-boton"
      >
        <Avatar
          tamano={104}
          iniciales={iniciales}
          ruta={ruta}
          url={local}
          className="vidrio vidrio-amarillo perfil-avatar"
        />
        <span aria-hidden="true" className="circulo-navy perfil-avatar-camara">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
            <path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          </svg>
        </span>
      </button>

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        onChange={alElegir}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        data-entrada-foto=""
      />

      <HojaInferior abierta={abierta} alCerrar={cerrar} titulo="Foto de perfil">
        {vista === "vista-previa" && elegida ? (
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={elegida.url}
              alt="Vista previa de tu foto"
              className="perfil-foto-previa"
              data-vista-previa=""
            />
          </div>
        ) : null}

        {vista === "quitar" ? (
          <p className="text-[17px] font-semibold text-texto-principal">¿Quitar tu foto?</p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-[15px] text-error-texto">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3">
          {vista === "menu" ? (
            <>
              <BotonVidrio type="button" onClick={abrirSelector}>
                Elegir o tomar foto
              </BotonVidrio>
              {ruta ? (
                <BotonVidrio
                  type="button"
                  tono="blanco"
                  flecha={false}
                  onClick={() => {
                    setError(null);
                    setVista("quitar");
                  }}
                >
                  Quitar foto
                </BotonVidrio>
              ) : null}
              <button type="button" onClick={cerrar} className="boton-ghost">
                Cancelar
              </button>
            </>
          ) : null}

          {vista === "vista-previa" ? (
            <>
              <BotonVidrio type="button" onClick={guardar} cargando={ocupada}>
                {ocupada ? "Guardando…" : "Guardar"}
              </BotonVidrio>
              <BotonVidrio
                type="button"
                tono="blanco"
                flecha={false}
                onClick={abrirSelector}
                disabled={ocupada}
              >
                Elegir otra
              </BotonVidrio>
            </>
          ) : null}

          {vista === "quitar" ? (
            <>
              <BotonVidrio type="button" flecha={false} onClick={quitar} cargando={ocupada}>
                {ocupada ? "Quitando…" : "Quitar foto"}
              </BotonVidrio>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setVista("menu");
                }}
                disabled={ocupada}
                className="boton-ghost"
              >
                Cancelar
              </button>
            </>
          ) : null}
        </div>
      </HojaInferior>
    </>
  );
}
