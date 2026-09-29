import { ContadorBeats } from "@/components/marca/contador-beats";
import { redirect } from "next/navigation";

import { TabBar } from "@/components/navegacion/tab-bar";
import { exigirPerfil } from "@/lib/usuario/sesion";

/**
 * Pantalla de Inicio (T032).
 *
 * El contador de Beats es la firma visual de la app (constitution §2): numero
 * grande en navy dentro de una card de vidrio, lo primero que se ve. Recien
 * registrada la persona ya tiene el bono de bienvenida, asi que el numero
 * nunca arranca en cero.
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
          <div className="vidrio-medio w-full px-6 py-10 text-center">
            <ContadorBeats valor={perfil.beats_balance} />
          </div>

          {/*
            Ya no hay caso cero: el perfil nace con el bono de bienvenida (spec
            de registro §9.16), asi que la ilustracion y el texto del estado
            vacio salieron (criterio 12).
          */}
          <p className="mt-4 max-w-[16rem] text-center text-texto-secundario">
            Sigue participando para sumar mas.
          </p>
        </section>
      </main>

      <TabBar />
    </>
  );
}
