"use client";

import { useState } from "react";

import { cerrarSesion } from "@/lib/sesion/cerrar-sesion";

/**
 * "Cerrar sesión" (Perfil). Sin confirmacion: un toque y sale.
 *
 * Al terminar va a la bienvenida con `location.replace` y no con el router de
 * Next: una carga completa descarta la cache de pantallas del router (que
 * guarda Inicio o Beats ya pintadas con los datos de la persona) y reemplaza
 * esta entrada del historial, asi que el boton atras no vuelve a Perfil.
 */
export function BotonCerrarSesion() {
  const [cerrando, setCerrando] = useState(false);

  async function alTocar() {
    if (cerrando) return;
    setCerrando(true);
    await cerrarSesion();
    window.location.replace("/");
  }

  return (
    <button
      type="button"
      onClick={alTocar}
      // aria-disabled y no disabled: un boton deshabilitado suelta el foco, y
      // quien navega con teclado o lector de pantalla quedaria en el vacio.
      aria-disabled={cerrando}
      className={`boton-secundario ${cerrando ? "opacity-60" : ""}`}
    >
      {cerrando ? (
        <>
          <span className="girador mr-2" aria-hidden="true" />
          Cerrando sesión…
        </>
      ) : (
        "Cerrar sesión"
      )}
    </button>
  );
}
