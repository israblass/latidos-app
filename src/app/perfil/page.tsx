import type { Metadata } from "next";

import { TabBar } from "@/components/navegacion/tab-bar";
import { BotonCerrarSesion } from "@/components/sesion/boton-cerrar-sesion";
import { exigirSesionConPerfil } from "@/lib/usuario/sesion";

export const metadata: Metadata = { title: "Perfil · Latidos" };

/**
 * Perfil minimo: el correo con el que la persona entra y el boton para cerrar
 * sesion. El Perfil completo (datos, QR personal, configuracion) es otra
 * historia (constitution §8).
 *
 * Se pinta en el servidor y con la sesion de quien la pide, asi que nunca se
 * guarda una copia: el service worker solo guarda la de /beats, que no lleva
 * datos de nadie.
 */
export default async function Perfil() {
  const { correo } = await exigirSesionConPerfil();

  return (
    <>
      <main className="flex min-h-dvh flex-col px-5 espacio-barra pt-6">
        <header className="flex min-h-touch items-center">
          <h1 className="titulo-pantalla">Perfil</h1>
        </header>

        <section aria-label="Tu cuenta" className="superficie mt-4 px-5 py-5">
          <p className="etiqueta">Correo</p>
          <p className="mt-1 break-all text-[15px] text-texto-principal">{correo}</p>
        </section>

        <div className="mt-6">
          <BotonCerrarSesion />
        </div>
      </main>

      <TabBar />
    </>
  );
}
