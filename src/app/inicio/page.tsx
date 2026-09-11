import Image from "next/image";
import { redirect } from "next/navigation";

import { TabBar } from "@/components/navegacion/tab-bar";
import { exigirPerfil } from "@/lib/usuario/sesion";

/**
 * Pantalla de Inicio (T032).
 *
 * El contador de Beats es la firma visual de la app (constitution §2): numero
 * grande en Anton amarillo, lo primero que se ve. Sobre la base clara el
 * amarillo puro pierde contraste, asi que el numero vive dentro de una card
 * oscura que lo sostiene. Recien registrada la persona marca cero, y el
 * onboarding que acaba de ver le dio el contexto de por que ese numero va a
 * empezar a moverse.
 */
export default async function Inicio() {
  const perfil = await exigirPerfil();

  // Quien todavia no vio el onboarding pasa por el antes de llegar aqui.
  if (!perfil.onboarding_visto) redirect("/onboarding/pantalla-1");

  return (
    <>
      <main className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
        <header className="flex items-center justify-between gap-3">
          {/* El diseño no lleva titulo visible (el contador es el heroe), pero
              sin un h1 un lector de pantalla no sabe anunciar donde esta. */}
          <h1 className="sr-only">Inicio</h1>
          <p className="text-[15px] text-texto-secundario">
            Hola,{" "}
            <span className="font-medium text-texto-principal">
              {perfil.nombre}
            </span>
          </p>
        </header>

        <section
          aria-label="Tu balance de Beats"
          className="flex flex-1 flex-col items-center justify-center"
        >
          <div className="vidrio-oscuro w-full px-6 py-10 text-center">
            <p className="font-display text-[72px] leading-none text-primario">
              {perfil.beats_balance}
            </p>
            <p className="etiqueta mt-1 text-white/70">Beats</p>
          </div>

          {/*
            Con cero Beats la pantalla es un estado vacio, y el microcopy guia a
            la accion en vez de disculparse (constitution §3). La ilustracion
            solo aparece aqui: en cuanto hay saldo, el numero es el protagonista
            y una ilustracion debajo le competiria.
          */}
          {perfil.beats_balance === 0 ? (
            <Image
              src="/assets/estados-vacios/vacio-sin-beats.webp"
              alt=""
              aria-hidden="true"
              width={150}
              height={150}
              className="mt-6"
            />
          ) : null}

          <p className="mt-4 max-w-[16rem] text-center text-texto-secundario">
            {perfil.beats_balance === 0
              ? "Escanea un QR de marca para empezar a sumar."
              : "Sigue participando para sumar mas."}
          </p>
        </section>
      </main>

      <TabBar />
    </>
  );
}
