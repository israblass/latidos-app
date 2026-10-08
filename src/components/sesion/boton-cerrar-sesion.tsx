"use client";

import { useCallback, useState } from "react";

import { BotonVidrio } from "@/components/ui/boton-vidrio";
import { HojaInferior } from "@/components/ui/hoja-inferior";
import { cerrarSesion } from "@/lib/sesion/cerrar-sesion";

/**
 * "Cerrar sesión" del Perfil (constitution §2, v2.11.0): texto centrado que
 * abre una hoja de vidrio para confirmar. Los dos botones de la hoja son tap
 * (BotonVidrio), sin circulo navy.
 *
 * Al terminar va a la bienvenida con `location.replace` y no con el router de
 * Next: una carga completa descarta la cache de pantallas del router (que
 * guarda Inicio o Beats ya pintadas con los datos de la persona) y reemplaza
 * esta entrada del historial, asi que el boton atras no vuelve a Perfil.
 */
export function BotonCerrarSesion() {
  const [abierta, setAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const alCerrarHoja = useCallback(() => {
    if (!cerrando) setAbierta(false);
  }, [cerrando]);

  async function confirmar() {
    if (cerrando) return;
    setCerrando(true);
    await cerrarSesion();
    window.location.replace("/");
  }

  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className="perfil-cerrar-sesion">
        Cerrar sesión
      </button>

      <HojaInferior abierta={abierta} alCerrar={alCerrarHoja} titulo="¿Cerrar sesión?">
        <p className="text-[15px] text-texto-secundario">
          Tus Beats quedan guardados en tu cuenta. Para volver, entra con tu correo y tu contraseña.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <BotonVidrio type="button" onClick={confirmar} cargando={cerrando}>
            {cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
          </BotonVidrio>
          <BotonVidrio type="button" tono="blanco" flecha={false} onClick={alCerrarHoja} disabled={cerrando}>
            Cancelar
          </BotonVidrio>
        </div>
      </HojaInferior>
    </>
  );
}
