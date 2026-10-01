"use client";

import Link from "next/link";

import { ContenidoSinConexion } from "@/components/marca/contenido-sin-conexion";
import { IlustracionSinSenal } from "@/components/marca/ilustracion-sin-senal";

/**
 * Pantalla de error de la app: lo que se ve si una pantalla falla al
 * pintarse, en lugar del error en blanco de Next. La ilustracion es la de sin
 * conexion (el latido con ruido), precacheada: se ve aunque el fallo venga de
 * que la red se cayo a medias.
 *
 * Sin rojo ni tono de culpa (constitution §3): la persona no hizo nada mal.
 *
 * Si el fallo es por falta de red, se dice eso. Pasa, por ejemplo, cuando el
 * service worker sirve la copia de /sin-conexion y el codigo de la pantalla
 * pedida no esta guardado: el error es "no hay señal", no "algo fallo".
 */
function esFaltaDeRed(error: Error) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  return error.name === "ChunkLoadError" || /Loading (CSS )?chunk|Failed to fetch/i.test(error.message);
}

export default function ErrorDeLaApp({ error, reset }: { error: Error; reset: () => void }) {
  if (esFaltaDeRed(error)) return <ContenidoSinConexion />;

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 pb-8 pt-4">
      <IlustracionSinSenal ancho={220} />
      <p className="etiqueta mt-8">Algo falló</p>
      <h1 className="titulo-pantalla mt-3">No pudimos abrir esta pantalla</h1>
      <p className="mt-4 text-texto-secundario">
        Intenta de nuevo en un momento. Tus Beats siguen guardados.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <button type="button" onClick={reset} className="boton-primario">
          Reintentar
        </button>
        <Link href="/inicio" className="boton-ghost">
          Ir a Inicio
        </Link>
      </div>
    </main>
  );
}
